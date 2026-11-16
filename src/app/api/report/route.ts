import { z } from "zod";
import { ok, fail, errorResponse, rateLimitedResponse, getClientIp } from "@/lib/http";
import { checkRateLimit } from "@/server/security/rate-limit";
import { db } from "@/lib/db";
import { newReportReference } from "@/server/catalog/reference";

export const dynamic = "force-dynamic";

/**
 * POST /api/report
 *
 * Illegal-content report endpoint. Reported videos are hidden immediately
 * (status UNDER_REVIEW) pending manual review, and every action is recorded
 * in the moderation log. The reporter receives a reference code for
 * follow-up; reports are stored with their status for the audit trail.
 */

const REPORT_CATEGORIES = [
  "MINOR",
  "NON_CONSENSUAL",
  "REVENGE_PORN",
  "DEEPFAKE",
  "HIDDEN_CAMERA",
  "LEAKED",
  "COPYRIGHT",
  "OTHER",
] as const;

const reportSchema = z.object({
  videoSlug: z
    .string()
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  reportedUrl: z.string().trim().max(300).optional(),
  category: z.enum(REPORT_CATEGORIES),
  details: z.string().trim().min(10, "Deskripsi minimal 10 karakter.").max(4000),
  reporterEmail: z.union([z.string().trim().email("Format email tidak valid.").max(200), z.literal("")]).optional(),
  consent: z.literal(true, { message: "Pernyataan kebenaran wajib dicentang." }),
});

export async function POST(request: Request) {
  const limit = checkRateLimit(`report:${getClientIp(request)}`, 10);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "VALIDATION", "Payload tidak valid.");
    }
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "VALIDATION", parsed.error.issues[0]?.message ?? "Payload tidak valid.");
    }
    const input = parsed.data;

    // Resolve the reported video (approved content only can be reported;
    // unknown slugs still produce a reference so the complaint is logged).
    const video = input.videoSlug
      ? await db.video.findFirst({
          where: { slug: input.videoSlug, status: { in: ["APPROVED", "UNDER_REVIEW"] } },
          select: { id: true, slug: true },
        })
      : null;

    const reference = newReportReference();

    const report = await db.report.create({
      data: {
        referenceCode: reference,
        videoId: video?.id ?? null,
        videoSlug: input.videoSlug ?? video?.slug ?? null,
        reportedUrl: input.reportedUrl ?? null,
        category: input.category,
        details: input.details,
        reporterEmail: input.reporterEmail ? input.reporterEmail : null,
        status: "RECEIVED",
      },
    });

    if (video) {
      // Fast removal path: hide instantly, review afterwards.
      await db.video.update({
        where: { id: video.id },
        data: { status: "UNDER_REVIEW", updatedAt: new Date() },
      });
      await db.moderationLog.create({
        data: {
          action: "HIDE_FOR_REPORT",
          entityType: "VIDEO",
          entityId: video.id,
          actor: "report-system",
          reason: input.category,
          detail: JSON.stringify({ report: reference }),
        },
      });
    }

    await db.analyticsEvent
      .create({ data: { type: "REPORT_SUBMIT", path: input.category, videoSlug: input.videoSlug ?? null } })
      .catch(() => undefined);

    return ok({
      reference,
      reportId: report.id,
      hiddenPendingReview: Boolean(video),
      message:
        "Laporan diterima. Konten yang dilaporkan disembunyikan otomatis selama peninjauan, dan akan dihapus permanen apabila terbukti melanggar kebijakan.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
