import { ok } from "@/lib/http";
import { db } from "@/lib/db";
import { getUpstreamCacheStats } from "@/server/upstream/upstream-client";
import { getPlaybackCacheStats } from "@/server/upstream/upstream-resolver";

export const dynamic = "force-dynamic";

/** Liveness + catalog health snapshot (no sensitive data). */
export async function GET() {
  let catalog: { approvedVideos: number; approvedFolders: number; pendingReview: number } | null = null;
  try {
    const [approvedVideos, approvedFolders, pendingReview] = await Promise.all([
      db.video.count({ where: { status: "APPROVED" } }),
      db.folder.count({ where: { status: "APPROVED", videoCount: { gt: 0 } } }),
      db.report.count({ where: { status: { in: ["RECEIVED", "REVIEWING"] } } }),
    ]);
    catalog = { approvedVideos, approvedFolders, pendingReview };
  } catch {
    catalog = null; // database unavailable: still report liveness
  }

  return ok({
    status: "ok",
    service: "videytube",
    catalog,
    uptimeSeconds: Math.round(process.uptime()),
    caches: {
      ...getUpstreamCacheStats(),
      playback: getPlaybackCacheStats(),
    },
    timestamp: new Date().toISOString(),
  });
}
