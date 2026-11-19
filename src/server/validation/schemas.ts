import { z } from "zod";

/**
 * Input validation schemas for all public API endpoints.
 * IDs mirror the upstream identifier charset; pages are bounded to prevent
 * abuse through unbounded values.
 */
export const safeIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "ID hanya boleh berisi huruf, angka, tanda hubung, atau garis bawah.");

export const pageParamSchema = z.coerce
  .number({ message: "Parameter halaman tidak valid." })
  .int("Parameter halaman harus berupa bilangan bulat.")
  .min(1, "Parameter halaman minimal 1.")
  .max(500, "Parameter halaman terlalu besar.");

export const searchQuerySchema = z.string().trim().min(1).max(100);
