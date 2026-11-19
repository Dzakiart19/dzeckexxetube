import { z } from "zod";

/**
 * Thin client for the internal API. Unwraps the consistent response envelope
 * and converts failures into typed ApiErrors with Indonesian messages.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const failureEnvelope = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

const successEnvelope = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

export async function apiRequest<T>(
  path: string,
  options: { signal?: AbortSignal; schema?: z.ZodType<T> } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { signal: options.signal, headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError("NETWORK", "Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.", 0);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (body && typeof body === "object") {
    const failure = failureEnvelope.safeParse(body);
    if (failure.success) {
      throw new ApiError(failure.data.error.code, failure.data.error.message, response.status);
    }
  }

  const success = successEnvelope.safeParse(body);
  if (!success.success) {
    throw new ApiError("INTERNAL_ERROR", "Respons server tidak valid.", response.status);
  }

  if (options.schema) {
    const parsed = options.schema.safeParse(success.data.data);
    if (!parsed.success) {
      throw new ApiError("INTERNAL_ERROR", "Format data dari server tidak sesuai.", response.status);
    }
    return parsed.data;
  }

  return success.data.data as T;
}
