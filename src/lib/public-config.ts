/**
 * Client-safe public configuration. Only non-sensitive values belong here
 * (they may be inlined into the browser bundle via NEXT_PUBLIC_* variables).
 */
export const PUBLIC_SITE_NAME = "videytube";

/** Planned production domain; canonical/OG URLs follow NEXT_PUBLIC_SITE_URL. */
export const PUBLIC_PLANNED_DOMAIN = "videytube.asia";

/**
 * HttpOnly cookie that stores the 18+ age-gate confirmation. The value is
 * meaningless (it is a gate flag, not an identity) and never contains PII.
 */
export const PUBLIC_AGE_GATE_NOTICE = "Konten dewasa 18+";

/** Minimum age required to browse playable content on this platform. */
export const PUBLIC_MIN_AGE = 18;
