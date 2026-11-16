import { PUBLIC_ROOT_FOLDER_ID } from "@/lib/public-config";

/**
 * URL and route helpers shared across server and client code.
 * Internal routes are always generated here so paths stay consistent.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw && raw.length > 0) return raw.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export function folderPath(folderId: string, page?: number): string {
  const base = `/folder/${encodeURIComponent(folderId)}`;
  return page && page > 1 ? `${base}?page=${page}` : base;
}

export function watchPath(videoId: string, fromFolderId?: string | null): string {
  const base = `/watch/${encodeURIComponent(videoId)}`;
  return fromFolderId ? `${base}?from=${encodeURIComponent(fromFolderId)}` : base;
}

export function searchPath(query?: string): string {
  if (!query || query.trim().length === 0) return "/search";
  return `/search?q=${encodeURIComponent(query.trim())}`;
}

export function rootFolderPath(page?: number): string {
  return folderPath(PUBLIC_ROOT_FOLDER_ID, page);
}

/** Relay endpoint that streams allowlisted video content with Range support. */
export function videoStreamPath(videoId: string): string {
  return `/api/videos/${encodeURIComponent(videoId)}/stream`;
}

/** Clamp a raw page query value into a safe positive integer (default 1). */
export function parsePageNumber(raw: string | null | undefined): number {
  if (!raw) return 1;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) return 1;
  return parsed;
}
