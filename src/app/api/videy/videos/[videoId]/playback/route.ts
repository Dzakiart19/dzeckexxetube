import { ValidationError } from "@/lib/errors";
import { errorResponse, fail, getClientIp, ok, rateLimitedResponse } from "@/lib/http";
import { config } from "@/lib/config";
import { checkRateLimit } from "@/server/security/rate-limit";
import { getProvider } from "@/server/providers/registry";
import { safeIdSchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/videy/videos/[videoId]/playback
 *
 * Returns the playback resolution state for platform 2. `ready` includes the
 * internal relay URL for the player; the raw upstream MP4 URL never leaves
 * the server. `?refresh=1` bypasses server caches once.
 */
export async function GET(request: Request, context: { params: Promise<{ videoId: string }> }) {
  const limit = checkRateLimit(`videy-playback:${getClientIp(request)}`, config.rateLimitPerMinute);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    const { videoId } = await context.params;
    const id = safeIdSchema.safeParse(videoId);
    if (!id.success) throw new ValidationError("ID video tidak valid.");

    const refresh = new URL(request.url).searchParams.get("refresh") === "1";
    const result = await getProvider("videy").resolvePublicPlayback(videoId, { refresh });

    if (result.status === "not-found") {
      return fail(404, "NOT_FOUND", "Video tidak ditemukan di sumber.");
    }
    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
