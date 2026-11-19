import { ValidationError } from "@/lib/errors";
import { errorResponse, getClientIp, ok, parsePageParam, rateLimitedResponse } from "@/lib/http";
import { config } from "@/lib/config";
import { checkRateLimit } from "@/server/security/rate-limit";
import { fetchFolder } from "@/server/providers/streamrizz/upstream-client";
import { safeIdSchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

/** GET /api/folders/[folderId]?page=1 — listing of a folder by id. */
export async function GET(request: Request, context: { params: Promise<{ folderId: string }> }) {
  const limit = checkRateLimit(`folders:${getClientIp(request)}`, config.rateLimitPerMinute);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    const { folderId } = await context.params;
    const id = safeIdSchema.safeParse(folderId);
    if (!id.success) throw new ValidationError("ID folder tidak valid.");

    const page = parsePageParam(new URL(request.url).searchParams.get("page"));
    if (page < 1) throw new ValidationError("Parameter halaman tidak valid.");

    const data = await fetchFolder(folderId, page);
    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}
