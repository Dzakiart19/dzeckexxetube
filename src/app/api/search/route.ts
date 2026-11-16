import { ok, fail, errorResponse, rateLimitedResponse, getClientIp, parsePageParam } from "@/lib/http";
import { checkRateLimit } from "@/server/security/rate-limit";
import { searchApprovedVideos } from "@/server/catalog/queries";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=&page=&category=&duration=&date=&sort=
 *
 * Searches only videos that passed moderation and belong to a verified,
 * active source. Search keywords are stored anonymously (aggregate only).
 */

function sanitizeFilter(value: string | null, allowed: string[]): string | null {
  if (!value) return null;
  return allowed.includes(value) ? value : null;
}

export async function GET(request: Request) {
  const limit = checkRateLimit(`search:${getClientIp(request)}`, 60);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    const params = new URL(request.url).searchParams;
    const query = (params.get("q") ?? "").trim();
    if (query.length === 0 || query.length > 100) {
      return fail(400, "VALIDATION", "Kata kunci pencarian wajib diisi (maksimal 100 karakter).");
    }
    const pageParam = parsePageParam(params.get("page"));
    if (pageParam < 1) return fail(400, "VALIDATION", "Parameter halaman tidak valid.");

    const category = sanitizeFilter(params.get("category"), ["asia", "barat", "amatir", "animasi", "mature", "pasangan", "solo", "umum"]);
    const duration = sanitizeFilter(params.get("duration"), ["short", "medium", "long", "extra"]);
    const date = sanitizeFilter(params.get("date"), ["day", "week", "month"]);
    const sort = sanitizeFilter(params.get("sort"), ["recent", "popular"]);

    const result = await searchApprovedVideos({
      query,
      page: pageParam,
      category,
      duration,
      date,
      sort,
    });

    // Anonymous aggregate search tracking (keyword + coarse result size).
    await db.analyticsEvent
      .create({
        data: {
          type: "SEARCH",
          query: query.slice(0, 120),
          path: result.total > 0 ? "search:hit" : "search:miss",
        },
      })
      .catch(() => undefined);

    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
