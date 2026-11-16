import { config } from "@/lib/config";
import {
  AppError,
  UpstreamError,
  UpstreamForbiddenError,
  UpstreamNotFoundError,
  UpstreamTimeoutError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { FolderResponse, VideoDetail } from "@/lib/types";
import { MemoryCache, withInflightDedup } from "@/server/cache/memory-cache";
import { isAllowedThumbnailUrl } from "@/server/security/allowlist";
import { safeIdSchema } from "@/server/validation/schemas";
import {
  cleanText,
  decodeEmbedToken,
  extractEmbedToken,
  extractPageTitle,
  isUpstreamNotFoundPage,
  parseFolderPage,
} from "./upstream-parser";
import type { InternalVideoDetail } from "./upstream-types";

/**
 * Upstream client: the single place that talks to the configured upstream site.
 *
 * Guarantees:
 *  - every request carries a realistic User-Agent and Referer header,
 *  - requests time out (AbortController) and map to typed errors,
 *  - folder/video results are cached in memory with configurable TTL,
 *  - concurrent requests for the same resource are deduplicated in-flight,
 *  - raw embed tokens stay in server memory and never reach callers.
 */

const folderCache = new MemoryCache<FolderResponse>(300);
const videoCache = new MemoryCache<InternalVideoDetail>(500);
const folderInflight = new Map<string, Promise<FolderResponse>>();
const videoInflight = new Map<string, Promise<InternalVideoDetail>>();

export interface UpstreamHtmlResponse {
  status: number;
  html: string;
}

export interface UpstreamFetchOptions {
  /** Do not throw on non-2xx; return the raw status instead (used by fallback parsing). */
  tolerateErrorStatus?: boolean;
}

/** Shared GET helper for upstream HTML endpoints. */
export async function fetchUpstreamHtml(
  path: string,
  options: UpstreamFetchOptions = {},
): Promise<UpstreamHtmlResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);
  try {
    const target = new URL(path, config.upstreamBaseUrl).toString();
    const response = await fetch(target, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": config.upstreamUserAgent,
        Referer: config.upstreamReferer,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!options.tolerateErrorStatus) {
      if (response.status === 403) throw new UpstreamForbiddenError();
      if (response.status === 404) throw new UpstreamNotFoundError();
      if (response.status === 429) {
        throw new UpstreamError("Layanan sumber sedang membatasi akses. Silakan coba lagi nanti.");
      }
      if (!response.ok) throw new UpstreamError();
    }

    const html = await response.text();
    return { status: response.status, html };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (controller.signal.aborted) throw new UpstreamTimeoutError();
    // Log only the path prefix: query strings may contain signed tokens.
    logger.warn("upstream fetch failed", { path: path.split("?")[0] });
    throw new UpstreamError("Layanan sumber tidak dapat dihubungi.");
  } finally {
    clearTimeout(timer);
  }
}

function assertSafeId(value: string, label: string): void {
  const parsed = safeIdSchema.safeParse(value);
  if (!parsed.success) {
    throw new UpstreamError(`Parameter ${label} tidak valid.`);
  }
}

/** Fetch and parse a folder listing page (cached, deduplicated). */
export async function fetchFolder(
  folderId: string,
  page: number,
  options: { refresh?: boolean } = {},
): Promise<FolderResponse> {
  assertSafeId(folderId, "folder");

  const cacheKey = `folder:${folderId}:p${page}`;
  if (!options.refresh) {
    const cached = folderCache.get(cacheKey);
    if (cached) return cached;
  }

  return withInflightDedup(folderInflight, cacheKey, async () => {
    const query = new URLSearchParams({ p: String(page) });
    const { html } = await fetchUpstreamHtml(`/f/${encodeURIComponent(folderId)}?${query.toString()}`);

    // Upstream returns HTTP 200 with a "404 Page Not Found" body for
    // missing folders; map it to a proper typed error.
    if (isUpstreamNotFoundPage(html)) throw new UpstreamNotFoundError("Folder tidak ditemukan di sumber.");

    const parsed = parseFolderPage(html, { folderId, page, baseUrl: config.upstreamBaseUrl });
    const response: FolderResponse = {
      folderId,
      page,
      title: parsed.title,
      folders: parsed.folders,
      videos: parsed.videos,
      hasNextPage: parsed.hasNextPage,
      source: "upstream",
      fetchedAt: new Date().toISOString(),
    };

    folderCache.set(cacheKey, response, config.cacheTtlFolderSeconds);
    return response;
  });
}

async function buildVideoDetail(videoId: string): Promise<InternalVideoDetail> {
  const { html } = await fetchUpstreamHtml(`/d/${encodeURIComponent(videoId)}`);

  // Upstream returns HTTP 200 with a "404 Page Not Found" body for missing
  // videos; surface it as a typed 404 instead of a bogus detail entry.
  if (isUpstreamNotFoundPage(html)) throw new UpstreamNotFoundError("Video tidak ditemukan di sumber.");

  const token = extractEmbedToken(html);
  const payload = token ? decodeEmbedToken(token) : null;
  const pageTitle = extractPageTitle(html);
  const payloadTitle = payload?.ti ? cleanText(payload.ti) : "";
  const title = payloadTitle || pageTitle || videoId;

  let thumbnailUrl: string | null = null;
  if (payload?.im) {
    const suffix = /\.[A-Za-z0-9]{2,5}$/.test(payload.im) ? "" : ".jpg";
    const candidate = `${config.imageCdnBaseUrl}/${payload.im}${suffix}`;
    thumbnailUrl = isAllowedThumbnailUrl(candidate) ? candidate : null;
  }

  const expiresAt =
    payload?.exp && Number.isFinite(payload.exp) && payload.exp > 0
      ? new Date(payload.exp < 1e12 ? payload.exp * 1000 : payload.exp).toISOString()
      : null;

  return {
    id: videoId,
    title,
    thumbnailUrl,
    playbackUrl: null,
    playbackSource: "none",
    duration: null,
    expiresAt,
    upstreamMetadata: {
      ...(payload?.rf ? { rf: payload.rf } : {}),
      ...(payload?.im ? { im: payload.im } : {}),
      ...(payload?.ti ? { ti: payload.ti } : {}),
    },
    fetchedAt: new Date().toISOString(),
    embedToken: token,
    embedPayload: payload ?? null,
  };
}

function toPublicDetail(internal: InternalVideoDetail): VideoDetail {
  return {
    id: internal.id,
    title: internal.title,
    thumbnailUrl: internal.thumbnailUrl,
    playbackUrl: internal.playbackUrl,
    playbackSource: internal.playbackSource,
    duration: internal.duration,
    expiresAt: internal.expiresAt,
    upstreamMetadata: internal.upstreamMetadata,
    fetchedAt: internal.fetchedAt,
  };
}

/** Internal detail including the raw token (server-side use only). */
export async function fetchInternalVideoDetail(
  videoId: string,
  options: { refresh?: boolean } = {},
): Promise<InternalVideoDetail> {
  assertSafeId(videoId, "video");

  const cacheKey = `video:${videoId}`;
  if (!options.refresh) {
    const cached = videoCache.get(cacheKey);
    if (cached) return cached;
  }

  return withInflightDedup(videoInflight, cacheKey, async () => {
    const built = await buildVideoDetail(videoId);
    videoCache.set(cacheKey, built, config.cacheTtlVideoSeconds);
    return built;
  });
}

/** Public detail for the API layer (token stripped). */
export async function fetchVideoDetail(
  videoId: string,
  options: { refresh?: boolean } = {},
): Promise<VideoDetail> {
  const internal = await fetchInternalVideoDetail(videoId, options);
  return toPublicDetail(internal);
}

/** Aggregate cache statistics for the health endpoint (no sensitive data). */
export function getUpstreamCacheStats(): Record<string, { size: number; hits: number; misses: number }> {
  return {
    folders: folderCache.stats(),
    videos: videoCache.stats(),
  };
}
