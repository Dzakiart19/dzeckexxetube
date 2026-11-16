import { config } from "@/lib/config";
import { errorResponse, fail, getClientIp, rateLimitedResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import type { ResolverStatus } from "@/lib/types";
import { checkRateLimit } from "@/server/security/rate-limit";
import { resolveInternalPlayback } from "@/server/upstream/upstream-resolver";
import { safeIdSchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

const CONTENT_TYPE_FALLBACK = "video/mp4";

/**
 * Server-side playback relay (abstraction layer over validated upstream URLs).
 *
 * Security properties:
 *  - the upstream URL is resolved internally by videoId; user input can
 *    never introduce an arbitrary host (no SSRF / no open proxy),
 *  - only hosts from the allowlist can be reached (enforced by the resolver),
 *  - upstream requires a same-site Referer; the relay adds the configured
 *    Referer and User-Agent headers,
 *  - Range requests are forwarded so seeking works in the HTML5 player.
 */
function playbackFailure(status: ResolverStatus): Response {
  switch (status) {
    case "expired":
      return fail(503, "PLAYBACK_UNAVAILABLE", "Video tidak dapat diputar karena URL playback sudah kedaluwarsa.");
    case "forbidden":
      return fail(502, "UPSTREAM_FORBIDDEN", "Video tidak dapat diputar karena dibatasi oleh penyedia konten.");
    case "not-found":
      return fail(404, "NOT_FOUND", "Video tidak ditemukan di sumber.");
    default:
      return fail(502, "PLAYBACK_UNAVAILABLE", "Video sedang tidak tersedia dari sumber.");
  }
}

async function openUpstream(url: string, rangeHeader: string | null): Promise<Response> {
  const controller = new AbortController();
  // Abort only until response headers arrive; the body then streams freely.
  const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);
  try {
    const headers: Record<string, string> = {
      "User-Agent": config.upstreamUserAgent,
      Referer: config.upstreamReferer,
      Accept: "*/*",
    };
    if (rangeHeader) headers.Range = rangeHeader;
    return await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers });
  } finally {
    clearTimeout(timer);
  }
}

async function drain(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // best effort
  }
}

function toVideoResponse(upstream: Response): Response {
  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? CONTENT_TYPE_FALLBACK);
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);
  headers.set("Accept-Ranges", upstream.headers.get("accept-ranges") ?? "bytes");
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(upstream.body, { status: upstream.status, headers });
}

export async function GET(request: Request, context: { params: Promise<{ videoId: string }> }) {
  const limit = checkRateLimit(`stream:${getClientIp(request)}`, config.rateLimitStreamPerMinute);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    const { videoId } = await context.params;
    const id = safeIdSchema.safeParse(videoId);
    if (!id.success) return fail(400, "INVALID_INPUT", "ID video tidak valid.");

    let internal = await resolveInternalPlayback(videoId);
    if (!internal.rawUrl) return playbackFailure(internal.status);

    const range = request.headers.get("range");
    let upstream = await openUpstream(internal.rawUrl, range);

    // Signed upstream URLs can expire mid-session: re-resolve once with
    // caches bypassed, then retry a single time.
    if (upstream.status === 403 || upstream.status === 404) {
      await drain(upstream);
      logger.info("relay retrying with refreshed playback url", { videoId, upstreamStatus: upstream.status });
      internal = await resolveInternalPlayback(videoId, { refresh: true });
      if (!internal.rawUrl) return playbackFailure(internal.status);
      upstream = await openUpstream(internal.rawUrl, range);
    }

    if (upstream.status !== 200 && upstream.status !== 206) {
      await drain(upstream);
      return fail(502, "PLAYBACK_UNAVAILABLE", "Video sedang tidak tersedia dari sumber.");
    }

    return toVideoResponse(upstream);
  } catch (error) {
    return errorResponse(error);
  }
}
