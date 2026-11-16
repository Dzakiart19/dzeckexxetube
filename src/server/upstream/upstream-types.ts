import { z } from "zod";
import type { PlaybackResult, VideoDetail } from "@/lib/types";

/**
 * Upstream-specific types. Public shapes live in `@/lib/types`; this module
 * adds the token payload schema and internal (server-only) variants that
 * carry the raw embed token. Internal variants must never be serialized to
 * clients, cached client-side, or persisted.
 */

/**
 * Payload decoded from the first Base64URL segment of the embed token.
 * Upstream tokens are two-part tokens (not JWTs), the first segment carries
 * the playback metadata. Required fields must be non-empty.
 */
export const embedPayloadSchema = z.object({
  rf: z.string().min(1),
  im: z.string().min(1),
  ti: z.string().min(1),
  id: z.string().optional(),
  exp: z.number().optional(),
  ri: z.string().optional(),
  bk: z.string().optional(),
});

export type EmbedTokenPayload = z.infer<typeof embedPayloadSchema>;

/** Server-only video detail including the raw token (never exposed). */
export interface InternalVideoDetail extends VideoDetail {
  embedToken: string | null;
  embedPayload: EmbedTokenPayload | null;
}

/** Server-only playback result including the raw upstream URL. */
export interface InternalPlaybackResult extends PlaybackResult {
  rawUrl: string | null;
}
