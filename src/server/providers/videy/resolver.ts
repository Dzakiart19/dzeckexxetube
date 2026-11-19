import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { videyVideoStreamPath } from "@/lib/urls";
import type { PlaybackResult, PlaybackSourceKind, ResolverStatus } from "@/lib/types";
import { MemoryCache, withInflightDedup } from "@/server/cache/memory-cache";
import { validateVideyPlaybackUrl } from "@/server/security/allowlist";
import { safeIdSchema } from "@/server/validation/schemas";
import { fetchInternalVideyDetail } from "./client";
import type { InternalPlayback } from "@/server/providers/types";

/**
 * videy playback resolver.
 *
 * Flow: watch page -> absolutized MP4 URL -> allowlist validation ->
 * direct probe (tiny Range request, redirects followed because the MP4 can
 * bounce to the volleybox CDN) -> ready. There is no fallback endpoint on
 * this platform; failures surface as typed statuses.
 */

const playbackCache = new MemoryCache<InternalPlayback>(300);
const playbackInflight = new Map<string, Promise<InternalPlayback>>();

const DIRECT_PROBE_TIMEOUT_MS = Math.min(config.videyTimeoutMs, 8_000);

function notFoundResult(videoId: string): InternalPlayback {
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

async function probeDirectUrl(url: string): Promise<{ ok: boolean; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DIRECT_PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      // The MP4 may redirect to the volleybox CDN edge; follow and trust the
      // final response, which was already validated by host allowlist rules.
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": config.videyUserAgent,
        Referer: config.videyReferer,
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
): Promise<InternalPlayback> {
  const cacheKey = `playback:${videoId}`;
  if (!options.refresh) {
    const cached = playbackCache.get(cacheKey);
    if (cached) return cached;
  }

  return withInflightDedup(playbackInflight, cacheKey, async () => {
    const detail = await fetchInternalVideyDetail(videoId, { refresh: options.refresh });

    let status: ResolverStatus = "upstream-error";
    let rawUrl: string | null = null;
    let playbackSource: PlaybackSourceKind = "none";

    const validation = detail.rawSourceUrl ? validateVideyPlaybackUrl(detail.rawSourceUrl) : null;
    if (validation?.ok && validation.url) {
      const probe = await probeDirectUrl(validation.url);
      if (probe.ok) {
        status = "ready";
        playbackSource = "direct-cdn";
        rawUrl = validation.url;
      } else {
        logger.info("videy direct probe rejected", { videoId, probeStatus: probe.status });
        status = probe.status === 403 ? "forbidden" : "upstream-error";
      }
    } else if (validation && !validation.ok) {
      logger.warn("videy source url rejected by allowlist", { videoId, reason: validation.reason });
      status = "forbidden";
    } else {
      status = "not-found";
    }

    const result: InternalPlayback = {
      videoId,
      status,
      playbackUrl: null,
      playbackSource,
      rawUrl,
      posterUrl: detail.thumbnailUrl,
      expiresAt: null,
      fetchedAt: new Date().toISOString(),
    };

    // Positive results live for the configured TTL; negatives 30s so retries
    // stay cheap without hammering the upstream.
    playbackCache.set(cacheKey, result, rawUrl ? config.videyPlaybackTtlSeconds : 30);
    return result;
  });
}

function toPublicPlayback(internal: InternalPlayback): PlaybackResult {
  return {
    videoId: internal.videoId,
    status: internal.status,
    playbackUrl: internal.rawUrl ? videyVideoStreamPath(internal.videoId) : null,
    playbackSource: internal.playbackSource,
    posterUrl: internal.posterUrl,
    expiresAt: internal.expiresAt,
    fetchedAt: internal.fetchedAt,
  };
}

/** Public playback resolution (no raw upstream URL included). */
export async function fetchVideyPlayback(
  videoId: string,
  options: { refresh?: boolean } = {},
): Promise<PlaybackResult> {
  const parsedId = safeIdSchema.safeParse(videoId);
  if (!parsedId.success) return notFoundResult(videoId);
  return toPublicPlayback(await resolveInternal(videoId, options));
}

/** Server-only accessor for the stream relay. */
export async function resolveVideyInternalPlayback(
  videoId: string,
  options: { refresh?: boolean } = {},
): Promise<InternalPlayback> {
  const parsedId = safeIdSchema.safeParse(videoId);
  if (!parsedId.success) return notFoundResult(videoId);
  return resolveInternal(videoId, options);
}

export function getVideyPlaybackCacheStats(): { size: number; hits: number; misses: number } {
  return playbackCache.stats();
}
