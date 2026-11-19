import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { videoStreamPath } from "@/lib/urls";
import type { PlaybackResult, PlaybackSourceKind, ResolverStatus } from "@/lib/types";
import { MemoryCache, withInflightDedup } from "@/server/cache/memory-cache";
import { validatePlaybackUrl } from "@/server/security/allowlist";
import { safeIdSchema } from "@/server/validation/schemas";
import { fetchInternalVideoDetail, fetchUpstreamHtml } from "./upstream-client";
import { parseFallbackSources } from "./upstream-parser";
import type { InternalPlaybackResult } from "./upstream-types";

/**
 * Playback resolver.
 *
 * Priority:
 *  1. Validate the direct CDN candidate ({videoCdnBase}/{rf}) with a
 *     tiny Range request (never downloads the video).
 *  2. On 403 / failure, call the upstream fallback endpoint stream.php and
 *     extract candidate sources from <source> / <video src> markup.
 *  3. Validate every candidate against the host allowlist before use.
 *  4. Otherwise surface a typed status (expired/forbidden/not-found/...).
 *
 * The raw upstream URL stays server-side; clients only ever receive the
 * internal relay path so the player can work around upstream Referer checks.
 */

const playbackCache = new MemoryCache<InternalPlaybackResult>(300);
const playbackInflight = new Map<string, Promise<InternalPlaybackResult>>();

const DIRECT_PROBE_TIMEOUT_MS = Math.min(config.upstreamTimeoutMs, 8_000);

interface DirectProbeResult {
  ok: boolean;
  status: number;
}

async function probeDirectUrl(url: string): Promise<DirectProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DIRECT_PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": config.upstreamUserAgent,
        Referer: config.upstreamReferer,
        Range: "bytes=0-0",
      },
    });
    try {
      await response.body?.cancel();
    } catch {
      // body cancel is best-effort
    }
    return { ok: response.status === 200 || response.status === 206, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function resolveInternal(
  videoId: string,
  options: { refresh?: boolean } = {},
): Promise<InternalPlaybackResult> {
  const cacheKey = `playback:${videoId}`;
  if (!options.refresh) {
    const cached = playbackCache.get(cacheKey);
    if (cached) return cached;
  }

  return withInflightDedup(playbackInflight, cacheKey, async () => {
    const detail = await fetchInternalVideoDetail(videoId, { refresh: options.refresh });
    const now = Date.now();
    const expiresAtMs = detail.expiresAt ? Date.parse(detail.expiresAt) : null;
    const expired = expiresAtMs !== null && Number.isFinite(expiresAtMs) && expiresAtMs < now;

    let status: ResolverStatus = "upstream-error";
    let rawUrl: string | null = null;
    let playbackSource: PlaybackSourceKind = "none";

    if (expired) {
      status = "expired";
    } else if (detail.embedToken) {
      const payload = detail.embedPayload;

      // 1. Direct CDN candidate.
      if (payload?.rf && /^[A-Za-z0-9_-]{1,256}$/.test(payload.rf)) {
        const direct = `${config.videoCdnBaseUrl}/${payload.rf}`;
        const probe = await probeDirectUrl(direct);
        if (probe.ok) {
          status = "ready";
          playbackSource = "direct-cdn";
          rawUrl = direct;
        } else {
          logger.info("direct cdn probe rejected, falling back", { videoId, probeStatus: probe.status });
        }
      }

      // 2. Fallback stream.php endpoint.
      if (!rawUrl) {
        const bucket =
          payload?.bk && /^[A-Za-z0-9_-]{1,64}$/.test(payload.bk) ? payload.bk : config.upstreamFallbackBucket;
        const query = new URLSearchParams({ bucket, id: videoId, t: detail.embedToken });
        const fallback = await fetchUpstreamHtml(`/stream.php?${query.toString()}`, {
          tolerateErrorStatus: true,
        });

        const validated = parseFallbackSources(fallback.html)
          .map((candidate) => validatePlaybackUrl(candidate))
          .find((candidate) => candidate.ok);

        if (validated?.url) {
          status = "fallback";
          playbackSource = "fallback-stream";
          rawUrl = validated.url;
        } else if (fallback.status === 403) {
          status = "forbidden";
        } else {
          status = "upstream-error";
        }
      }
    } else {
      // No usable token on the detail page: nothing we can resolve.
      status = "not-found";
    }

    const result: InternalPlaybackResult = {
      videoId,
      status,
      playbackUrl: null,
      playbackSource,
      rawUrl,
      posterUrl: detail.thumbnailUrl,
      expiresAt: detail.expiresAt,
      fetchedAt: new Date().toISOString(),
    };

    // Positive results live for the configured TTL; negative results are
    // cached briefly so upstream is not hammered but retries stay cheap.
    playbackCache.set(cacheKey, result, rawUrl ? config.cacheTtlPlaybackSeconds : 30);
    return result;
  });
}

export function toPublicPlayback(internal: InternalPlaybackResult): PlaybackResult {
  return {
    videoId: internal.videoId,
    status: internal.status,
    playbackUrl: internal.rawUrl ? videoStreamPath(internal.videoId) : null,
    playbackSource: internal.playbackSource,
    posterUrl: internal.posterUrl,
    expiresAt: internal.expiresAt,
    fetchedAt: internal.fetchedAt,
  };
}

/** Public playback resolution (no raw upstream URL included). */
export async function fetchPlayback(
  videoId: string,
  options: { refresh?: boolean } = {},
): Promise<PlaybackResult> {
  const parsedId = safeIdSchema.safeParse(videoId);
  if (!parsedId.success) {
    return {
      videoId,
      status: "not-found",
      playbackUrl: null,
      playbackSource: "none",
      posterUrl: null,
      expiresAt: null,
      fetchedAt: new Date().toISOString(),
    };
  }
  const internal = await resolveInternal(videoId, options);
  return toPublicPlayback(internal);
}

/** Server-only accessor for the stream relay route. */
export async function resolveInternalPlayback(
  videoId: string,
  options: { refresh?: boolean } = {},
): Promise<InternalPlaybackResult> {
  const parsedId = safeIdSchema.safeParse(videoId);
  if (!parsedId.success) {
    return {
      videoId,
      status: "not-found",
      playbackUrl: null,
      playbackSource: "none",
      rawUrl: null,
      posterUrl: null,
      expiresAt: null,
      fetchedAt: new Date().toISOString(),
    };
  }
  return resolveInternal(videoId, options);
}

export function getPlaybackCacheStats(): { size: number; hits: number; misses: number } {
  return playbackCache.stats();
}
