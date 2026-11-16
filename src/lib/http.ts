import type { PlaybackSourceKind, PlaybackResult, FolderResponse, VideoDetail } from "@/lib/types";
import { logger } from "@/lib/logger";
import { toErrorPayload } from "@/lib/errors";
import type { RateLimitResult } from "@/server/security/rate-limit";

/**
 * HTTP helpers for internal API route handlers.
 * All responses share one consistent envelope:
 *   success -> { "success": true,  "data": ... }
 *   failure -> { "success": false, "error": { "code", "message" } }
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string };
}

export function ok<T>(data: T, init?: ResponseInit): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return Response.json(body, init);
}

export function fail(status: number, code: string, message: string, headers?: HeadersInit): Response {
  const body: ApiFailure = { success: false, error: { code, message } };
  return Response.json(body, { status, headers });
}

export function rateLimitedResponse(limit: RateLimitResult): Response {
  return fail(429, "RATE_LIMITED", "Terlalu banyak permintaan. Silakan coba lagi beberapa saat.", {
    "Retry-After": String(Math.max(1, limit.retryAfterSeconds)),
  });
}

/**
 * Convert a thrown value into a safe error response. Unexpected errors are
 * logged (with redaction) but their internals are never exposed to clients.
 */
export function errorResponse(error: unknown): Response {
  const payload = toErrorPayload(error);
  if (payload.isServerError) {
    logger.error("request failed", {
      code: payload.code,
      status: payload.status,
      detail: error instanceof Error ? error.message : String(error),
    });
  }
  const headers: Record<string, string> = {};
  if (payload.retryAfterSeconds) headers["Retry-After"] = String(payload.retryAfterSeconds);
  return fail(payload.status, payload.code, payload.message, headers);
}

/** Extract the client IP from proxy headers, falling back to a stable key. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "local";
}

/** Parse and validate the `page` query parameter (defaults to 1). */
export function parsePageParam(raw: string | null): number {
  if (raw === null || raw === "") return 1;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) {
    return -1; // signal handled by callers via ValidationError
  }
  return parsed;
}

export type { FolderResponse, VideoDetail, PlaybackResult, PlaybackSourceKind };
