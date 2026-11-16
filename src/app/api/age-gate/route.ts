import { cookies } from "next/headers";
import { ok, rateLimitedResponse, getClientIp } from "@/lib/http";
import { checkRateLimit } from "@/server/security/rate-limit";
import { AGE_GATE_COOKIE, AGE_GATE_MAX_AGE_SECONDS, ageGateCookieOptions } from "@/server/security/age-gate";

export const dynamic = "force-dynamic";

/**
 * POST /api/age-gate
 *
 * Records the visitor's 18+ confirmation in an HttpOnly cookie (no PII,
 * no identity). The flag lets server components render gated content.
 */
export async function POST(request: Request) {
  const limit = checkRateLimit(`age-gate:${getClientIp(request)}`, 30);
  if (!limit.allowed) return rateLimitedResponse(limit);

  const store = await cookies();
  store.set(AGE_GATE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: ageGateCookieOptions().secure,
    path: "/",
    maxAge: AGE_GATE_MAX_AGE_SECONDS,
  });

  return ok({ confirmed: true, minAge: 18 });
}
