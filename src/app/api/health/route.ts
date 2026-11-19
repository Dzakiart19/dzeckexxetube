import { ok } from "@/lib/http";
import { getUpstreamCacheStats } from "@/server/providers/streamrizz/upstream-client";
import { getPlaybackCacheStats } from "@/server/providers/streamrizz/upstream-resolver";
import { getVideyCacheStats } from "@/server/providers/videy/client";
import { getVideyPlaybackCacheStats } from "@/server/providers/videy/resolver";

export const dynamic = "force-dynamic";

/** Liveness + internal cache statistics (no sensitive data). */
export async function GET() {
  return ok(
    {
      status: "ok",
      service: "videytube",
      uptimeSeconds: Math.round(process.uptime()),
      caches: {
        // Platform 1 (streamrizz)
        ...getUpstreamCacheStats(),
        playback: getPlaybackCacheStats(),
        // Platform 2 (videy)
        videyList: getVideyCacheStats().list,
        videyVideos: getVideyCacheStats().videos,
        videyPlayback: getVideyPlaybackCacheStats(),
      },
      timestamp: new Date().toISOString(),
    },
    // Keep-alive responses must never be cached by CDN/proxies: a cached hit
    // would bypass the function and fail to keep the instance warm.
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
