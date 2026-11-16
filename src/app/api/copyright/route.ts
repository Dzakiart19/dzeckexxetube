import { z } from "zod";
import { ok, fail, errorResponse, rateLimitedResponse, getClientIp } from "@/lib/http";
import { checkRateLimit } from "@/server/security/rate-limit";
import { db } from "@/lib/db";
import { newTakedownReference } from "@/server/catalog/reference";

export const dynamic = "force-dynamic";

/**
 * POST /api/copyright
 *
 * DMCA / copyright takedown endpoint. A valid request removes the reported
 * catalog entry immediately (status REMOVED) and records the takedown in
 * the moderation log. The complainant receives a reference code.
 */

const takedownSchema = z.object({
  videoSlug: z
    .string()
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  complainantName: z.string().trim().min(2, "Nama pelapor wajib diisi.").max(120),
  complainantEmail: z.string().trim().email("Format email tidak valid.").max(200),
  originalWorkUrl: z.string().trim().max(300).optional(),
  infringingUrl: z.string().trim().min(4, "URL konten yang dilaporkan wajib diisi.").max(300),
  goodFaith: z.literal(true, { message: "Pernyataan itikad baik wajib dicentang." }),
  accuracy: z.literal(true, { message: "Pernyataan akurasi wajib dicentang." }),
  signature: z.string().trim().min(2, "Tanda tangan (nama lengkap) wajib diisi.").max(120),
});

export async function POST(request: Request) {
  const limit = checkRateLimit(`takedown:${getClientIp(request)}`, 10);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "VALIDATION", "Payload tidak valid.");
    }
    const parsed = takedownSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "VALIDATION", parsed.error.issues[0]?.message ?? "Payload tidak valid.");
    }
    const input = parsed.data;

    const video = input.videoSlug
      ? await db.video.findFirst({
          where: { slug: input.videoSlug, status: { in: ["APPROVED", "UNDER_REVIEW"] } },
          select: { id: true, slug: true },
        })
      : null;

    const reference = newTakedownReference();

    const takedown = await db.takedown.create({
      data: {
        referenceCode: reference,
        videoId: video?.id ?? null,
        complainantName: input.complainantName,
        complainantEmail: input.complainantEmail,
        originalWorkUrl: input.originalWorkUrl || null,
        infringingUrl: input.infringingUrl,
        goodFaith: input.goodFaith,
        accuracy: input.accuracy,
        signature: input.signature,
        status: video ? "CONTENT_REMOVED" : "RECEIVED",
        handledAt: video ? new Date() : null,
      },
    });

    if (video) {
      await db.video.update({
        where: { id: video.id },
        data: { status: "REMOVED", updatedAt: new Date() },
      });
      await db.moderationLog.create({
        data: {
          action: "TAKEDOWN_REMOVE",
          entityType: "VIDEO",
          entityId: video.id,
          actor: "copyright-system",
          reason: "COPYRIGHT",
          detail: JSON.stringify({ takedown: reference }),
        },
      });
    }

    await db.analyticsEvent
      .create({ data: { type: "TAKEDOWN_SUBMIT", path: "copyright", videoSlug: input.videoSlug ?? null } })
      .catch(() => undefined);

    return ok({
      reference,
      takedownId: takedown.id,
      removedImmediately: Boolean(video),
      message: video
        ? "Permintaan takedown diterima dan konten telah dihapus dari katalog."
        : "Permintaan takedown diterima. Entri tidak ditemukan pada katalog aktif saat ini.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
