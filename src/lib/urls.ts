import { PUBLIC_SITE_NAME } from "@/lib/public-config";

/**
 * URL and route helpers shared across server and client code.
 * Internal routes are always generated here so paths stay consistent.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw && raw.length > 0) return raw.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export function homePath(): string {
  return "/";
}

export function explorePath(page?: number): string {
  return page && page > 1 ? `/explore?page=${page}` : "/explore";
}

export function categoryPath(slug: string, page?: number): string {
  const base = `/category/${encodeURIComponent(slug)}`;
  return page && page > 1 ? `${base}?page=${page}` : base;
}

export function folderPath(slug: string, page?: number): string {
  const base = `/folder/${encodeURIComponent(slug)}`;
  return page && page > 1 ? `${base}?page=${page}` : base;
}

export function watchPath(slug: string): string {
  return `/watch/${encodeURIComponent(slug)}`;
}

export function searchPath(query?: string): string {
  if (!query || query.trim().length === 0) return "/search";
  return `/search?q=${encodeURIComponent(query.trim())}`;
}

export function sourcesPath(): string {
  return "/sources";
}

export function reportPath(prefillPath?: string): string {
  if (!prefillPath) return "/report";
  return `/report?url=${encodeURIComponent(prefillPath)}`;
}

export function copyrightPath(prefillPath?: string): string {
  if (!prefillPath) return "/copyright";
  return `/copyright?url=${encodeURIComponent(prefillPath)}`;
}

export function adultContentPolicyPath(): string {
  return "/adult-content-policy";
}

export function communityGuidelinesPath(): string {
  return "/community-guidelines";
}

export function privacyPath(): string {
  return "/privacy";
}

export function termsPath(): string {
  return "/terms";
}

export function contactPath(): string {
  return "/contact";
}

/**
 * Internal thumbnail relay. The browser only ever sees a Videytube path; the
 * allowlisted upstream image URL stays server-side.
 */
export function thumbPath(thumbnailUrl: string | null | undefined): string | null {
  if (!thumbnailUrl) return null;
  return `/api/thumb?src=${encodeURIComponent(thumbnailUrl)}`;
}

/** Relay endpoint that streams allowlisted video content with Range support. */
export function videoStreamPath(videoId: string): string {
  return `/api/videos/${encodeURIComponent(videoId)}/stream`;
}

/** Clamp a raw page query value into a safe positive integer (default 1). */
export function parsePageNumber(raw: string | string[] | null | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return 1;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) return 1;
  return parsed;
}

/** Full-page size used across folder/video listings. */
export const VIDEOS_PER_PAGE = 24;

/** Folder page size used on explore/category listings. */
export const FOLDERS_PER_PAGE = 12;
