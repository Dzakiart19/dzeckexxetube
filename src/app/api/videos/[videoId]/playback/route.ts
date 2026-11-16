import { ValidationError } from "@/lib/errors";
import { errorResponse, fail, getClientIp, ok, rateLimitedResponse } from "@/lib/http";
import { config } from "@/lib/config";
import { checkRateLimit } from "@/server/security/rate-limit";
import { fetchPlayback } from "@/server/upstream/upstream-resolver";
import { isApprovedUpstreamVideo } from "@/server/catalog/queries";
import { safeIdSchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/videos/[videoId]/playback
 *
 * Returns the playback resolution state. `ready`/`fallback` include the
 * internal relay URL for the player; the raw upstream URL and the embed
 * token never leave the server. `?refresh=1` bypasses server caches once.
 *
 * Moderation gate: only catalog entries with status APPROVED on a verified,
 * active source can be resolved. Arbitrary upstream ids are rejected.
 */
export async function GET(request: Request, context: { params: Promise<{ videoId: string }> }) {
  const limit = checkRateLimit(`playback:${getClientIp(request)}`, config.rateLimitPerMinute);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    const { videoId } = await context.params;
    const id = safeIdSchema.safeParse(videoId);
    if (!id.success) throw new ValidationError("ID video tidak valid.");

    const approved = await isApprovedUpstreamVideo(videoId);
    if (!approved) return fail(404, "NOT_FOUND", "Video tidak ditemukan di katalog termoderasi.");

    const refresh = new URL(request.url).searchParams.get("refresh") === "1";
    const result = await fetchPlayback(videoId, { refresh });

    if (result.status === "not-found") {
      return fail(404, "NOT_FOUND", "Video tidak ditemukan di sumber.");
    }
    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
