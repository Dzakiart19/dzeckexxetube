/**
 * Typed application errors. Every error carries:
 *  - code: stable machine-readable error code exposed in the API envelope
 *  - httpStatus: proper HTTP status for the route handler
 *  - userMessage: user-facing message in Indonesian (never leaks internals)
 *
 * Sensitive values (embed tokens, upstream query strings) must never be
 * embedded in these messages.
 */
export type ErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_FORBIDDEN"
  | "UPSTREAM_ERROR"
  | "PLAYBACK_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly userMessage: string;
  readonly retryAfterSeconds?: number;

  constructor(
    code: ErrorCode,
    httpStatus: number,
    userMessage: string,
    options?: { retryAfterSeconds?: number; cause?: unknown },
  ) {
    super(userMessage, { cause: options?.cause });
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.userMessage = userMessage;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Parameter tidak valid.") {
    super("INVALID_INPUT", 400, message);
  }
}

export class UpstreamTimeoutError extends AppError {
  constructor() {
    super("UPSTREAM_TIMEOUT", 504, "Koneksi ke sumber video terlalu lama. Silakan coba lagi.");
  }
}

export class UpstreamForbiddenError extends AppError {
  constructor(message = "Sumber upstream menolak permintaan akses.") {
    super("UPSTREAM_FORBIDDEN", 502, message);
  }
}

export class UpstreamNotFoundError extends AppError {
  constructor(message = "Konten tidak ditemukan di sumber.") {
    super("NOT_FOUND", 404, message);
  }
}

export class InvalidUpstreamPayloadError extends AppError {
  constructor() {
    super("UPSTREAM_ERROR", 502, "Data video sedang tidak dapat diambil. Silakan coba lagi.");
  }
}

export class UpstreamError extends AppError {
  constructor(message = "Layanan sumber sedang bermasalah. Silakan coba lagi.") {
    super("UPSTREAM_ERROR", 502, message);
  }
}

export class PlaybackUnavailableError extends AppError {
  constructor(message = "Video sedang tidak tersedia dari sumber.") {
    super("PLAYBACK_UNAVAILABLE", 503, message);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds: number) {
    super("RATE_LIMITED", 429, "Terlalu banyak permintaan. Silakan coba lagi beberapa saat.", {
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    });
  }
}

export interface ErrorPayload {
  status: number;
  code: ErrorCode;
  message: string;
  retryAfterSeconds?: number;
  isServerError: boolean;
}

/**
 * Map any thrown value into a safe API error payload. Unknown errors never
 * leak their original message (may contain stack traces or internal paths).
 */
export function toErrorPayload(error: unknown): ErrorPayload {
  if (error instanceof AppError) {
    return {
      status: error.httpStatus,
      code: error.code,
      message: error.userMessage,
      retryAfterSeconds: error.retryAfterSeconds,
      isServerError: error.httpStatus >= 500,
    };
  }
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Terjadi kesalahan internal. Silakan coba lagi.",
    isServerError: true,
  };
}
