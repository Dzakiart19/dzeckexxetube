import { ValidationError } from "@/lib/errors";
import { errorResponse, getClientIp, ok, rateLimitedResponse } from "@/lib/http";
import { config } from "@/lib/config";
import { checkRateLimit } from "@/server/security/rate-limit";
import { fetchVideoDetail } from "@/server/providers/streamrizz/upstream-client";
import { safeIdSchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

/** GET /api/videos/[videoId] — video metadata (never includes the raw token). */
export async function GET(request: Request, context: { params: Promise<{ videoId: string }> }) {
  const limit = checkRateLimit(`videos:${getClientIp(request)}`, config.rateLimitPerMinute);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    const { videoId } = await context.params;
    const id = safeIdSchema.safeParse(videoId);
    if (!id.success) throw new ValidationError("ID video tidak valid.");

    const data = await fetchVideoDetail(videoId);
    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}
