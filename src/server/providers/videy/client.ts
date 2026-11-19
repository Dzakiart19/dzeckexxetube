import { config } from "@/lib/config";
import {
  AppError,
  UpstreamError,
  UpstreamForbiddenError,
  UpstreamNotFoundError,
  UpstreamTimeoutError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { MemoryCache, withInflightDedup } from "@/server/cache/memory-cache";
import { safeIdSchema } from "@/server/validation/schemas";
import { parseVideyList, parseVideyWatch, isVideyNotFoundPage } from "./parser";
import type { VideyListResponse, VideyInternalDetail } from "./types";

/**
 * videy upstream client (platform 2).
 *
 * Same guarantees as the streamrizz client:
 *  - realistic User-Agent/Referer on every request,
 *  - AbortController timeout mapped to typed errors,
 *  - in-memory TTL caches with in-flight deduplication,
 *  - raw MP4 URLs stay in server memory and never reach clients.
 */

const listCache = new MemoryCache<VideyListResponse>(300);
const videoCache = new MemoryCache<VideyInternalDetail>(500);
const listInflight = new Map<string, Promise<VideyListResponse>>();
const videoInflight = new Map<string, Promise<VideyInternalDetail>>();

export interface VideyHtmlResponse {
  status: number;
  html: string;
  /** Final URL after redirects — the base for absolutizing relative paths. */
  finalUrl: string;
}

export interface VideyFetchOptions {
  tolerateErrorStatus?: boolean;
}

/** Shared GET helper for videy HTML endpoints. */
export async function fetchVideyHtml(
  path: string,
  options: VideyFetchOptions = {},
): Promise<VideyHtmlResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.videyTimeoutMs);
  try {
    const target = new URL(path, config.videyBaseUrl).toString();
    const response = await fetch(target, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": config.videyUserAgent,
        Referer: config.videyReferer,
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
    return { status: response.status, html, finalUrl: response.url || target };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (controller.signal.aborted) throw new UpstreamTimeoutError();
    logger.warn("videy upstream fetch failed", { path: path.split("?")[0] });
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

/** Fetch and parse a videy listing page (cached, deduplicated). */
export async function fetchVideyList(
  page: number,
  sort: string,
  options: { refresh?: boolean } = {},
): Promise<VideyListResponse> {
  const cacheKey = `list:p${page}:s${sort}`;
  if (!options.refresh) {
    const cached = listCache.get(cacheKey);
    if (cached) return cached;
  }

  return withInflightDedup(listInflight, cacheKey, async () => {
    const query = new URLSearchParams({ page: String(page), sort });
    const { html, finalUrl } = await fetchVideyHtml(`/?${query.toString()}`);

    if (isVideyNotFoundPage(html)) throw new UpstreamNotFoundError("Daftar video tidak ditemukan di sumber.");

    const parsed = parseVideyList(html, { page, sort, baseUrl: finalUrl });
    const response: VideyListResponse = {
      page,
      sort,
      videos: parsed.videos,
      hasNextPage: parsed.hasNextPage,
      totalPages: parsed.totalPages,
      source: "upstream",
      fetchedAt: new Date().toISOString(),
    };

    listCache.set(cacheKey, response, config.videyListTtlSeconds);
    return response;
  });
}

/** Fetch and parse a videy watch page into a server-side internal detail. */
export async function fetchInternalVideyDetail(
  videoId: string,
  options: { refresh?: boolean } = {},
): Promise<VideyInternalDetail> {
  assertSafeId(videoId, "video");

  const cacheKey = `video:${videoId}`;
  if (!options.refresh) {
    const cached = videoCache.get(cacheKey);
    if (cached) return cached;
  }

  return withInflightDedup(videoInflight, cacheKey, async () => {
    const { html, finalUrl } = await fetchVideyHtml(`/watch.php?id=${encodeURIComponent(videoId)}`);

    if (isVideyNotFoundPage(html)) {
      throw new UpstreamNotFoundError("Video tidak ditemukan di sumber.");
    }

    const parsed = parseVideyWatch(html, { videoId, baseUrl: finalUrl });
    if (!parsed.sourceUrl) {
      // Watch page rendered but has no playable source: treat as missing.
      throw new UpstreamNotFoundError("Video tidak ditemukan di sumber.");
    }

    const detail: VideyInternalDetail = {
      id: videoId,
      title: parsed.title,
      thumbnailUrl: parsed.thumbnailUrl,
      duration: parsed.duration ?? null,
      views: parsed.views ?? null,
      rawSourceUrl: parsed.sourceUrl,
      fetchedAt: new Date().toISOString(),
    };

    videoCache.set(cacheKey, detail, config.videyVideoTtlSeconds);
    return detail;
  });
}

/** Aggregate cache statistics for the health endpoint. */
export function getVideyCacheStats(): Record<string, { size: number; hits: number; misses: number }> {
  return {
    list: listCache.stats(),
    videos: videoCache.stats(),
  };
}
