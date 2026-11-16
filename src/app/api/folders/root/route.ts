import { config } from "@/lib/config";
import { ValidationError } from "@/lib/errors";
import { errorResponse, getClientIp, ok, parsePageParam, rateLimitedResponse } from "@/lib/http";
import { checkRateLimit } from "@/server/security/rate-limit";
import { fetchFolder } from "@/server/upstream/upstream-client";

export const dynamic = "force-dynamic";

/** GET /api/folders/root?page=1 — listing of the configured root folder. */
export async function GET(request: Request) {
  const limit = checkRateLimit(`folders:${getClientIp(request)}`, config.rateLimitPerMinute);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    const page = parsePageParam(new URL(request.url).searchParams.get("page"));
    if (page < 1) throw new ValidationError("Parameter halaman tidak valid.");
    const data = await fetchFolder(config.upstreamRootFolderId, page);
    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}
