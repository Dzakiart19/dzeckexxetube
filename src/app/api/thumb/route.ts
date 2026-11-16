import { ok, fail, errorResponse, rateLimitedResponse, getClientIp } from "@/lib/http";
import { checkRateLimit } from "@/server/security/rate-limit";
import { isAllowedThumbnailUrl } from "@/server/security/allowlist";
import { config } from "@/lib/config";

export const revalidate = 86400;

/**
 * GET /api/thumb?src=...
 *
 * Thumbnail relay. Browsers only ever see this Videytube path; the source
 * image URL is validated against the image-CDN allowlist before any request
 * is made, so the relay can never be abused as an open image proxy.
 */
export async function GET(request: Request) {
  const limit = checkRateLimit(`thumb:${getClientIp(request)}`, 300);
  if (!limit.allowed) return rateLimitedResponse(limit);

  const src = new URL(request.url).searchParams.get("src");
  if (!src) return fail(400, "VALIDATION", "Parameter src wajib diisi.");

  // Only exact image-CDN hosts are relayed.
  const normalized = src.startsWith("//") ? `https:${src}` : src;
  if (!isAllowedThumbnailUrl(normalized)) {
    return fail(400, "VALIDATION", "Sumber gambar tidak diizinkan.");
  }

  try {
    const upstream = await fetch(normalized, {
      headers: {
        "User-Agent": config.upstreamUserAgent,
        Referer: config.upstreamReferer,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok || !upstream.body) {
      return fail(404, "NOT_FOUND", "Thumbnail tidak tersedia.");
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return fail(404, "NOT_FOUND", "Thumbnail tidak tersedia.");
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fail(504, "UPSTREAM_ERROR", "Thumbnail tidak dapat dimuat saat ini.");
  }
}
