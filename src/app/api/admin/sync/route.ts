import { ok, fail, rateLimitedResponse, getClientIp, errorResponse } from "@/lib/http";
import { config } from "@/lib/config";
import { checkRateLimit } from "@/server/security/rate-limit";
import { syncCatalog } from "@/server/catalog/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/admin/sync  (header: x-admin-key)
 *
 * Internal maintenance endpoint that runs a bounded catalog sync. Disabled
 * unless ADMIN_SYNC_KEY is configured. Never exposed in navigation or the
 * sitemap.
 */
export async function POST(request: Request) {
  const limit = checkRateLimit(`admin-sync:${getClientIp(request)}`, 4);
  if (!limit.allowed) return rateLimitedResponse(limit);

  if (!config.adminSyncKey) {
    return fail(404, "NOT_FOUND", "Endpoint tidak tersedia.");
  }

  const provided = request.headers.get("x-admin-key") ?? "";
  if (provided !== config.adminSyncKey) {
    return fail(401, "UNAUTHORIZED", "Kunci admin tidak valid.");
  }

  try {
    const stats = await syncCatalog();
    return ok({ stats });
  } catch (error) {
    return errorResponse(error);
  }
}
