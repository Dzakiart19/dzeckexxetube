import { z } from "zod";
import { ok, fail, errorResponse, rateLimitedResponse, getClientIp } from "@/lib/http";
import { checkRateLimit } from "@/server/security/rate-limit";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/analytics
 *
 * Anonymous, aggregate-only event tracking. No identifiers, no raw query
 * strings, no playback URLs: only coarse route kinds, search keywords and
 * video slugs. Play events also bump the anonymous popularity counter.
 */

const EVENT_TYPES = ["PAGE_VIEW", "SEARCH", "VIDEO_PLAY", "VIDEO_ERROR", "REPORT_SUBMIT", "TAKEDOWN_SUBMIT"] as const;

const eventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  path: z
    .string()
    .max(64)
    .regex(/^[A-Za-z0-9/_-]*$/)
    .optional(),
  query: z.string().trim().max(120).optional(),
  videoSlug: z
    .string()
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export async function POST(request: Request) {
  const limit = checkRateLimit(`analytics:${getClientIp(request)}`, 120);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "VALIDATION", "Payload tidak valid.");
    }
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) return fail(400, "VALIDATION", "Payload tidak valid.");

    const { type, path, query, videoSlug } = parsed.data;

    await db.analyticsEvent.create({
      data: {
        type,
        path: path ?? null,
        query: query ?? null,
        videoSlug: videoSlug ?? null,
      },
    });

    if (type === "VIDEO_PLAY" && videoSlug) {
      // Anonymous popularity counter; no per-visitor state is stored.
      await db.video.updateMany({
        where: { slug: videoSlug, status: "APPROVED" },
        data: { viewCount: { increment: 1 } },
      });
    }

    return ok({ recorded: true });
  } catch (error) {
    return errorResponse(error);
  }
}
