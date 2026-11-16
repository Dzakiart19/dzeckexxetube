import { ApiError } from "@/lib/api-client";

/**
 * Convert any caught value into a user-facing Indonesian message.
 * Server envelopes already carry safe messages; anything else falls back.
 */
export function describeApiError(error: unknown, fallback = "Terjadi kesalahan. Silakan coba lagi."): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}
