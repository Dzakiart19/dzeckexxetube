import { ValidationError } from "@/lib/errors";
import { errorResponse, getClientIp, ok, rateLimitedResponse } from "@/lib/http";
import { config } from "@/lib/config";
import { checkRateLimit } from "@/server/security/rate-limit";
import { getProvider } from "@/server/providers/registry";
import { safeIdSchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

/** GET /api/videy/videos/[videoId] — videy video metadata (no raw MP4 URL). */
export async function GET(request: Request, context: { params: Promise<{ videoId: string }> }) {
  const limit = checkRateLimit(`videy-videos:${getClientIp(request)}`, config.rateLimitPerMinute);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    const { videoId } = await context.params;
    const id = safeIdSchema.safeParse(videoId);
    if (!id.success) throw new ValidationError("ID video tidak valid.");

    const refresh = new URL(request.url).searchParams.get("refresh") === "1";
    const data = await getProvider("videy").getVideoDetail(videoId, { refresh });
    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}
