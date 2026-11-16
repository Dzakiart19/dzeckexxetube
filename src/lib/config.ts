import { z } from "zod";

/**
 * Server-side runtime configuration.
 *
 * Values come from environment variables with sensible development defaults.
 * This module must never be imported from client components because it may
 * contain upstream access configuration (User-Agent, Referer, cache policy).
 */
const envSchema = z.object({
  UPSTREAM_BASE_URL: z.url().default("https://upstream.example"),
  UPSTREAM_ROOT_FOLDER_ID: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,64}$/)
    .default("your-root-folder-id"),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(15_000),
  UPSTREAM_USER_AGENT: z
    .string()
    .min(8)
    .default(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    ),
  UPSTREAM_REFERER: z.url().default("https://upstream.example/"),
  VIDEO_CDN_BASE_URL: z.url().default("https://video-cdn.example"),
  IMAGE_CDN_BASE_URL: z.url().default("https://image-cdn.example/image"),
  /** Comma-separated regex patterns for edge playback hosts returned by the upstream fallback endpoint. */
  PLAYBACK_HOST_PATTERNS: z.string().min(1).default("^mp4-\\d+\\.mp4-edge\\.example$"),
  /** Bucket used by the upstream fallback endpoint when the payload omits one. */
  UPSTREAM_FALLBACK_BUCKET: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,64}$/)
    .default("video-bucket"),
  CACHE_TTL_FOLDER_SECONDS: z.coerce.number().int().min(30).max(86_400).default(600),
  CACHE_TTL_VIDEO_SECONDS: z.coerce.number().int().min(30).max(3_600).default(180),
  CACHE_TTL_PLAYBACK_SECONDS: z.coerce.number().int().min(15).max(900).default(120),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(5).max(1_000).default(60),
  RATE_LIMIT_STREAM_PER_MINUTE: z.coerce.number().int().min(10).max(2_000).default(240),
  /** Shared secret for POST /api/admin/sync; empty disables the endpoint. */
  ADMIN_SYNC_KEY: z.string().min(16).max(128).default(""),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail soft: keep the application bootable with defaults instead of crashing
  // on a malformed environment variable.
  console.warn("[config] invalid environment variables detected, using defaults");
}

const raw = parsed.success ? parsed.data : envSchema.parse({});

/** camelCase runtime configuration consumed by server modules. */
export const config = {
  upstreamBaseUrl: raw.UPSTREAM_BASE_URL,
  upstreamRootFolderId: raw.UPSTREAM_ROOT_FOLDER_ID,
  upstreamTimeoutMs: raw.UPSTREAM_TIMEOUT_MS,
  upstreamUserAgent: raw.UPSTREAM_USER_AGENT,
  upstreamReferer: raw.UPSTREAM_REFERER,
  videoCdnBaseUrl: raw.VIDEO_CDN_BASE_URL,
  imageCdnBaseUrl: raw.IMAGE_CDN_BASE_URL,
  playbackHostPatterns: raw.PLAYBACK_HOST_PATTERNS,
  upstreamFallbackBucket: raw.UPSTREAM_FALLBACK_BUCKET,
  cacheTtlFolderSeconds: raw.CACHE_TTL_FOLDER_SECONDS,
  cacheTtlVideoSeconds: raw.CACHE_TTL_VIDEO_SECONDS,
  cacheTtlPlaybackSeconds: raw.CACHE_TTL_PLAYBACK_SECONDS,
  rateLimitPerMinute: raw.RATE_LIMIT_PER_MINUTE,
  rateLimitStreamPerMinute: raw.RATE_LIMIT_STREAM_PER_MINUTE,
  adminSyncKey: raw.ADMIN_SYNC_KEY,
  logLevel: raw.LOG_LEVEL,
} as const;

export type AppConfig = typeof config;
