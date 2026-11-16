import { z } from "zod";

/**
 * Zod schemas validating internal API responses on the client side.
 * They mirror `@/lib/types` and guard against malformed upstream data
 * reaching the UI.
 */
export const folderResponseSchema = z.object({
  folderId: z.string(),
  page: z.number(),
  title: z.string().nullable(),
  folders: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
    }),
  ),
  videos: z.array(
    z.object({
      id: z.string(),
      title: z.string().nullable(),
      url: z.string(),
      thumbnailUrl: z.string().nullable().optional(),
    }),
  ),
  hasNextPage: z.boolean().nullable(),
  source: z.literal("upstream"),
  fetchedAt: z.string(),
});

export const videoDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnailUrl: z.string().nullable(),
  playbackUrl: z.string().nullable(),
  playbackSource: z.enum(["direct-cdn", "fallback-stream", "none"]),
  duration: z.number().nullable(),
  expiresAt: z.string().nullable(),
  upstreamMetadata: z.object({
    rf: z.string().optional(),
    im: z.string().optional(),
    ti: z.string().optional(),
  }),
  fetchedAt: z.string(),
});

export const playbackResultSchema = z.object({
  videoId: z.string(),
  status: z.enum(["ready", "fallback", "expired", "forbidden", "not-found", "upstream-error"]),
  playbackUrl: z.string().nullable(),
  playbackSource: z.enum(["direct-cdn", "fallback-stream", "none"]),
  posterUrl: z.string().nullable(),
  expiresAt: z.string().nullable(),
  fetchedAt: z.string(),
});
