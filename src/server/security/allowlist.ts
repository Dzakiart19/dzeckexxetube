/**
 * Host allowlist for all upstream-derived URLs.
 *
 * The application must never become an open proxy or an SSRF gateway:
 *  - upstream HTML is only ever fetched from the configured base URL path,
 *  - playback URLs returned by the upstream fallback endpoint are validated
 *    against a tightly bounded set of host patterns before use,
 *  - user input can never introduce a new host.
 *
 * Allowed hosts are derived from the configured CDN base URLs plus the extra
 * edge-host family patterns supplied through PLAYBACK_HOST_PATTERNS, so no
 * upstream identity is hardcoded in source code.
 */
import { config } from "@/lib/config";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hostnameOf(base: string): string | null {
  try {
    const hostname = new URL(base).hostname;
    return hostname.length > 0 ? hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

function parseHostPatterns(raw: string): RegExp[] {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .reduce<RegExp[]>((patterns, entry) => {
      try {
        patterns.push(new RegExp(entry, "i"));
      } catch {
        // Skip malformed patterns; the static allowlist below still applies.
      }
      return patterns;
    }, []);
}

const videoCdnHost = hostnameOf(config.videoCdnBaseUrl);
const imageCdnHost = hostnameOf(config.imageCdnBaseUrl);

const PLAYBACK_HOST_PATTERNS: RegExp[] = [
  ...(videoCdnHost ? [new RegExp(`^${escapeRegExp(videoCdnHost)}$`, "i")] : []),
  ...parseHostPatterns(config.playbackHostPatterns),
];

const VIDEY_HOST_PATTERNS: RegExp[] = parseHostPatterns(config.videyHostPatterns);

const THUMBNAIL_HOST = imageCdnHost;

/**
 * Path segments may legitimately contain percent-encoded characters (spaces,
 * unicode) because upstream file names are used verbatim in CDN URLs. The
 * pattern accepts plain safe characters or valid %XX triplets only.
 */
const PATH_SAFE_PATTERN = /^\/(?:[A-Za-z0-9_\-./]|%[0-9A-Fa-f]{2})*$/;
const QUERY_SAFE_PATTERN = /^[&=?A-Za-z0-9_\-./%]*$/;

export interface PlaybackUrlValidation {
  ok: boolean;
  url: string | null;
  reason: "https-required" | "host-not-allowed" | "unsafe-url" | null;
}

/**
 * Shared URL shape validation: https only, no credentials, no non-standard
 * ports, safe path/query character sets. Host matching is delegated to the
 * supplied pattern set so each platform keeps its own allowlist.
 */
function validateUrlShape(raw: string, patterns: RegExp[]): PlaybackUrlValidation {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, url: null, reason: "unsafe-url" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, url: null, reason: "https-required" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, url: null, reason: "unsafe-url" };
  }
  // Non-default ports are never needed for the allowlisted hosts.
  if (parsed.port) {
    return { ok: false, url: null, reason: "unsafe-url" };
  }
  if (!patterns.some((pattern) => pattern.test(parsed.hostname))) {
    return { ok: false, url: null, reason: "host-not-allowed" };
  }
  if (!PATH_SAFE_PATTERN.test(parsed.pathname) || (parsed.search && !QUERY_SAFE_PATTERN.test(parsed.search))) {
    return { ok: false, url: null, reason: "unsafe-url" };
  }
  return { ok: true, url: parsed.toString(), reason: null };
}

/**
 * Validate a playback URL returned by upstream parsers.
 * Returns the normalized URL string when the host is allowed, otherwise null.
 */
export function validatePlaybackUrl(raw: string): PlaybackUrlValidation {
  return validateUrlShape(raw, PLAYBACK_HOST_PATTERNS);
}

/** Validate a videy platform playback URL against the videy host allowlist. */
export function validateVideyPlaybackUrl(raw: string): PlaybackUrlValidation {
  return validateUrlShape(raw, VIDEY_HOST_PATTERNS);
}

/** Thumbnail URLs are served directly by the configured image CDN host. */
export function isAllowedThumbnailUrl(raw: string): boolean {
  if (!THUMBNAIL_HOST) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" && parsed.hostname.toLowerCase() === THUMBNAIL_HOST;
  } catch {
    return false;
  }
}

export function isAllowedPlaybackHost(hostname: string): boolean {
  return PLAYBACK_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}
