import { cookies } from "next/headers";

/**
 * Age-gate helpers. The confirmation is stored in an HttpOnly cookie set by
 * POST /api/age-gate. The flag carries no identity information; it only
 * records that the visitor confirmed the minimum-age notice.
 */

export const AGE_GATE_COOKIE = "vt_age_ok";
export const AGE_GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

/** Server-side check usable from any server component or route handler. */
export async function isAgeVerified(): Promise<boolean> {
  const store = await cookies();
  return store.get(AGE_GATE_COOKIE)?.value === "1";
}

export interface AgeGateCookieOptions {
  secure: boolean;
}

export function ageGateCookieOptions(): AgeGateCookieOptions {
  // Secure only matters when the site is served over HTTPS (production).
  return { secure: process.env.NODE_ENV === "production" };
}
