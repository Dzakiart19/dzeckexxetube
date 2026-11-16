import { z } from "zod";
import { ok, fail, errorResponse, rateLimitedResponse, getClientIp } from "@/lib/http";
import { checkRateLimit } from "@/server/security/rate-limit";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/contact
 *
 * General contact form. Messages are stored for handling by the compliance
 * team; no auto-response is sent and no marketing use is made of the data.
 */

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi.").max(120),
  email: z.string().trim().email("Format email tidak valid.").max(200),
  subject: z.enum(["general", "legal", "cooperation", "other"], { message: "Subjek tidak valid." }),
  message: z.string().trim().min(10, "Pesan minimal 10 karakter.").max(4000),
});

export async function POST(request: Request) {
  const limit = checkRateLimit(`contact:${getClientIp(request)}`, 10);
  if (!limit.allowed) return rateLimitedResponse(limit);

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "VALIDATION", "Payload tidak valid.");
    }
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "VALIDATION", parsed.error.issues[0]?.message ?? "Payload tidak valid.");
    }

    await db.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });

    return ok({ received: true, message: "Pesan terkirim. Tim kami membalas dalam 2-3 hari kerja." });
  } catch (error) {
    return errorResponse(error);
  }
}
