import { z } from 'zod';
import { readFileSync } from 'fs';
// mini dotenv parser mirip Next.js
const env = {};
for (const line of readFileSync('/home/z/my-project/.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2];
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1]] = v;
}
const envSchema = z.object({
  UPSTREAM_BASE_URL: z.url().default("https://upstream.example"),
  UPSTREAM_ROOT_FOLDER_ID: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).default("your-root-folder-id"),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(15_000),
  UPSTREAM_USER_AGENT: z.string().min(8).default("Mozilla/5.0 Chrome"),
  UPSTREAM_REFERER: z.url().default("https://upstream.example/"),
  VIDEO_CDN_BASE_URL: z.url().default("https://video-cdn.example"),
  IMAGE_CDN_BASE_URL: z.url().default("https://image-cdn.example/image"),
  PLAYBACK_HOST_PATTERNS: z.string().min(1).default("^mp4-edge$"),
  UPSTREAM_FALLBACK_BUCKET: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).default("video-bucket"),
  CACHE_TTL_FOLDER_SECONDS: z.coerce.number().int().min(30).max(86_400).default(600),
  CACHE_TTL_VIDEO_SECONDS: z.coerce.number().int().min(30).max(3_600).default(180),
  CACHE_TTL_PLAYBACK_SECONDS: z.coerce.number().int().min(15).max(900).default(120),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(5).max(1_000).default(60),
  RATE_LIMIT_STREAM_PER_MINUTE: z.coerce.number().int().min(10).max(2_000).default(240),
  LOG_LEVEL: z.enum(["debug","info","warn","error"]).default("info"),
});
const r = envSchema.safeParse(env);
if (!r.success) {
  for (const issue of r.error.issues) {
    const v = env[issue.path[0]];
    console.log("INVALID:", issue.path[0], "| issue:", issue.message, "| masked:", typeof v === 'string' ? JSON.stringify(v.slice(0, 80)) : v);
  }
} else console.log("ALL VALID");
