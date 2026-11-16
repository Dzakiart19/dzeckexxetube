import { ok } from "@/lib/http";
import { getUpstreamCacheStats } from "@/server/upstream/upstream-client";
import { getPlaybackCacheStats } from "@/server/upstream/upstream-resolver";

export const dynamic = "force-dynamic";

/** Liveness + internal cache statistics (no sensitive data). */
export async function GET() {
  return ok({
    status: "ok",
    service: "videytube",
    uptimeSeconds: Math.round(process.uptime()),
    caches: {
      ...getUpstreamCacheStats(),
      playback: getPlaybackCacheStats(),
    },
    timestamp: new Date().toISOString(),
  });
}
