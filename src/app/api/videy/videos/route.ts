import { config } from "@/lib/config";
import { errorResponse, getClientIp, ok, parsePageParam, rateLimitedResponse } from "@/lib/http";
import { ValidationError } from "@/lib/errors";
import { checkRateLimit } from "@/server/security/rate-limit";
import { getProvider } from "@/server/providers/registry";
import type { ListSort } from "@/server/providers/types";

export const dynamic = "force-dynamic";

const SORTS: ListSort[] = ["terbaru", "trending", "lama"];

function parseSort(raw: string | null): ListSort | ValidationError {
  if (raw === null || raw === "" || raw === "terbaru") return "terbaru";
  if (SORTS.includes(raw as ListSort)) return raw as ListSort;
  return new ValidationError("Parameter urutan tidak valid.");
}

/**
 * GET /api/videy/videos?page=1&sort=terbaru
 * Flat video listing for platform 2 (videy), with sort + pagination.
 */
export async function GET(request: Request) {
  const limit = checkRateLimit(`videy-list:${getClientIp(request)}`, config.rateLimitPerMinute);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    const url = new URL(request.url);
    const page = parsePageParam(url.searchParams.get("page"));
    if (page === -1) throw new ValidationError("Parameter halaman tidak valid.");

    const sortResult = parseSort(url.searchParams.get("sort"));
    if (sortResult instanceof ValidationError) throw sortResult;

    const refresh = url.searchParams.get("refresh") === "1";
    const discovery = await getProvider("videy").getDiscovery({ page, sort: sortResult, refresh });

    return ok({
      page: discovery.page,
      sort: sortResult,
      videos: discovery.videos,
      hasNextPage: discovery.hasNextPage,
      totalPages: discovery.totalPages,
      source: "upstream" as const,
      fetchedAt: discovery.fetchedAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
