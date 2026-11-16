import { config } from "@/lib/config";
import { errorResponse, fail, getClientIp, rateLimitedResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import type { ResolverStatus } from "@/lib/types";
import { checkRateLimit } from "@/server/security/rate-limit";
import { validatePlaybackUrl } from "@/server/security/allowlist";
import { resolveInternalPlayback } from "@/server/upstream/upstream-resolver";
import { isApprovedUpstreamVideo } from "@/server/catalog/queries";
import { safeIdSchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

const CONTENT_TYPE_FALLBACK = "video/mp4";
const HLS_PLAYBACK_TYPE = "application/vnd.apple.mpegurl";

/**
 * Server-side playback relay (abstraction layer over validated upstream URLs).
 *
 * Security properties:
 *  - the upstream URL is resolved internally by videoId; user input can
 *    never introduce an arbitrary host (no SSRF / no open proxy),
 *  - only hosts from the allowlist can be reached (enforced by the resolver),
 *  - HLS playlists are rewritten so every segment/key request stays inside
 *    this relay (`?u=` targets are re-validated against the allowlist),
 *  - upstream requires a same-site Referer; the relay adds the configured
 *    Referer and User-Agent headers,
 *  - Range requests are forwarded so seeking works in the HTML5 player,
 *  - moderation gate: only approved catalog entries can be relayed.
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

/** Map a relayed upstream target to a sane media content type. */
function mediaContentType(targetUrl: string, upstreamType: string | null): string {
  const path = targetUrl.split("?")[0].toLowerCase();
  if (path.endsWith(".ts")) return "video/mp2t";
  if (path.endsWith(".m4s") || path.endsWith(".mp4")) return "video/iso.segment";
  if (path.endsWith(".aac")) return "audio/aac";
  if (path.endsWith(".key")) return "application/octet-stream";
  return upstreamType ?? CONTENT_TYPE_FALLBACK;
}

function toVideoResponse(upstream: Response, targetUrl?: string): Response {
  const headers = new Headers();
  headers.set(
    "Content-Type",
    targetUrl ? mediaContentType(targetUrl, upstream.headers.get("content-type")) : upstream.headers.get("content-type") ?? CONTENT_TYPE_FALLBACK,
  );
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);
  headers.set("Accept-Ranges", upstream.headers.get("accept-ranges") ?? "bytes");
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(upstream.body, { status: upstream.status, headers });
}

/** Relay URL for a validated absolute upstream target. */
function relayUrlFor(videoId: string, absoluteUrl: string): string | null {
  const validated = validatePlaybackUrl(absoluteUrl);
  if (!validated.ok || !validated.url) return null;
  return `/api/videos/${encodeURIComponent(videoId)}/stream?u=${encodeURIComponent(validated.url)}`;
}

/**
 * Rewrite an HLS playlist so every URI (segments, keys, maps, nested
 * playlists) is routed back through this relay with a validated `u` target.
 * Entries that fail validation are left untouched; the player will surface
 * a media error instead of leaking the raw upstream URL.
 */
function rewriteHlsPlaylist(body: string, videoId: string, playlistUrl: string): string {
  const relayFor = (target: string): string => {
    try {
      const absolute = new URL(target, playlistUrl).toString();
      return relayUrlFor(videoId, absolute) ?? target;
    } catch {
      return target;
    }
  };

  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return line;
      if (trimmed.startsWith("#")) {
        return trimmed.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${relayFor(uri)}"`);
      }
      return relayFor(trimmed);
    })
    .join("\n");
}

function toPlaylistResponse(body: string): Response {
  const headers = new Headers();
  headers.set("Content-Type", HLS_PLAYBACK_TYPE);
  headers.set("Cache-Control", "private, max-age=15");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(body, { status: 200, headers });
}

export async function GET(request: Request, context: { params: Promise<{ videoId: string }> }) {
  const limit = checkRateLimit(`stream:${getClientIp(request)}`, config.rateLimitStreamPerMinute);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    const { videoId } = await context.params;
    const id = safeIdSchema.safeParse(videoId);
    if (!id.success) return fail(400, "INVALID_INPUT", "ID video tidak valid.");

    // Moderation gate: never relay content that is not an approved catalog entry.
    const approved = await isApprovedUpstreamVideo(videoId);
    if (!approved) return fail(404, "NOT_FOUND", "Video tidak ditemukan di katalog termoderasi.");

    const requestUrl = new URL(request.url);
    const rawTarget = requestUrl.searchParams.get("u");

    // HLS segment/key relay: the target comes from a playlist we rewrote
    // ourselves, but it is still re-validated against the allowlist here so
    // user input can never widen the reachable host set. Nested media
    // playlists are rewritten as well; only true media segments stream raw.
    if (rawTarget) {
      const validated = validatePlaybackUrl(rawTarget);
      if (!validated.ok || !validated.url) {
        return fail(400, "INVALID_INPUT", "Target pemutaran tidak valid.");
      }
      const isNestedPlaylist = validated.url.split("?")[0].endsWith(".m3u8");
      if (isNestedPlaylist) {
        const playlistResponse = await openUpstream(validated.url, null);
        if (playlistResponse.status !== 200) {
          await drain(playlistResponse);
          return fail(502, "PLAYBACK_UNAVAILABLE", "Bagian video sedang tidak tersedia dari sumber.");
        }
        const body = await playlistResponse.text();
        return toPlaylistResponse(rewriteHlsPlaylist(body, videoId, validated.url));
      }
      const range = request.headers.get("range");
      const upstream = await openUpstream(validated.url, range);
      if (upstream.status !== 200 && upstream.status !== 206) {
        await drain(upstream);
        return fail(502, "PLAYBACK_UNAVAILABLE", "Bagian video sedang tidak tersedia dari sumber.");
      }
      return toVideoResponse(upstream, validated.url);
    }

    let internal = await resolveInternalPlayback(videoId);
    if (!internal.rawUrl) return playbackFailure(internal.status);

    const range = request.headers.get("range");

    // HLS master/media playlist: fetch as text, rewrite URIs through the
    // relay, and serve it with the playlist content type.
    if (internal.playbackSource === "hls-stream" || internal.rawUrl.split("?")[0].endsWith(".m3u8")) {
      let playlistResponse = await openUpstream(internal.rawUrl, null);
      if (playlistResponse.status === 403 || playlistResponse.status === 404) {
        await drain(playlistResponse);
        internal = await resolveInternalPlayback(videoId, { refresh: true });
        if (!internal.rawUrl) return playbackFailure(internal.status);
        playlistResponse = await openUpstream(internal.rawUrl, null);
      }
      if (playlistResponse.status !== 200) {
        await drain(playlistResponse);
        return fail(502, "PLAYBACK_UNAVAILABLE", "Video sedang tidak tersedia dari sumber.");
      }
      const body = await playlistResponse.text();
      return toPlaylistResponse(rewriteHlsPlaylist(body, videoId, internal.rawUrl));
    }

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
