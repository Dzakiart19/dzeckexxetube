import * as cheerio from "cheerio";
import { config } from "@/lib/config";
import { isAllowedThumbnailUrl } from "@/server/security/allowlist";
import { embedPayloadSchema, type EmbedTokenPayload } from "./upstream-types";
import type { FolderLink, VideoSummary } from "@/lib/types";

/**
 * Tolerant HTML parsers for the upstream site.
 *
 * Design rules:
 *  - never rely on a single fragile CSS class; identifiers are extracted
 *    from link paths (/f/{id}, /d/{id}) found on ANY anchor,
 *  - titles fall back through multiple attributes, then the page title,
 *  - results are deduplicated by id while preserving upstream order,
 *  - URLs are normalized consistently (internal links stay relative).
 */

const FOLDER_ID_PATTERN = /\/f\/([A-Za-z0-9_-]{1,64})(?:[/?#]|$)/;
const VIDEO_ID_PATTERN = /\/d\/([A-Za-z0-9_-]{1,64})(?:[/?#]|$)/;

const EMOJI_PATTERN = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu;

const EMBED_TOKEN_PATTERNS = [
  /(?:var|let|const)\s+embedToken\s*=\s*(['"])([^'"]+)\1/i,
  /\bembedToken\s*=\s*(['"])([^'"]+)\1/i,
];

export interface ParsedFolderPage {
  title: string | null;
  folders: FolderLink[];
  videos: VideoSummary[];
  hasNextPage: boolean | null;
}

/** Normalize whitespace, strip emojis/pictographs, cap length. */
export function cleanText(raw: string): string {
  return raw
    .replace(EMOJI_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const parsed = new URL(href, baseUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function isBackLink(className: string, text: string): boolean {
  if (/back|breadcrumb/i.test(className)) return true;
  const normalized = text.replace(/[←<\-→>]/g, "").trim().toLowerCase();
  return normalized === "back" || normalized === "kembali";
}

/**
 * Site brand derived from the configured upstream hostname (e.g. the second
 * label of "www.example-site.com" -> "example-site"). Used to strip the
 * upstream branding suffix from page titles without hardcoding any name.
 */
const UPSTREAM_BRAND: string = (() => {
  try {
    const labels = new URL(config.upstreamBaseUrl).hostname.toLowerCase().split(".");
    return labels.length >= 2 ? labels[labels.length - 2] : "";
  } catch {
    return "";
  }
})();

function extractTitleFromDocument($: cheerio.CheerioAPI): string | null {
  const fromTitleTag = cleanText($("title").first().text());
  if (fromTitleTag) {
    const withoutBrand = UPSTREAM_BRAND
      ? fromTitleTag.replace(new RegExp(`\\s*[-|]\\s*${UPSTREAM_BRAND}\\s*$`, "i"), "")
      : fromTitleTag;
    return withoutBrand.trim() || null;
  }
  const fromOg = cleanText($('meta[property="og:title"]').attr("content") ?? "");
  return fromOg || null;
}

/** Parse a folder listing page into folders, videos and pagination evidence. */
export function parseFolderPage(
  html: string,
  options: { folderId: string; page: number; baseUrl: string },
): ParsedFolderPage {
  const $ = cheerio.load(html);
  const title = extractTitleFromDocument($);

  const folders = new Map<string, FolderLink>();
  const videos = new Map<string, VideoSummary>();

  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    const resolved = normalizeUrl(href, options.baseUrl);
    if (!resolved) return;

    const className = $(element).attr("class") ?? "";
    const linkText = cleanText($(element).text());

    // Pagination buttons reuse the /f/ path with ?p=; never treat them as folders.
    if (/page-btn/i.test(className)) return;

    const folderMatch = resolved.match(FOLDER_ID_PATTERN);
    if (folderMatch) {
      const id = folderMatch[1];
      if (id !== options.folderId && !isBackLink(className, linkText) && !folders.has(id)) {
        const name = cleanText($(element).find("span").first().text()) || linkText || id;
        folders.set(id, { id, name, url: `/f/${id}` });
      }
      return;
    }

    const videoMatch = resolved.match(VIDEO_ID_PATTERN);
    if (videoMatch) {
      const id = videoMatch[1];
      if (!videos.has(id)) {
        const candidateTitle =
          cleanText($(element).attr("title") ?? "") ||
          cleanText($(element).attr("aria-label") ?? "") ||
          linkText ||
          null;
        const rawThumb =
          $(element).find("img").first().attr("src") ??
          $(element).closest("article").find("img").first().attr("src") ??
          null;
        const thumbnailUrl = rawThumb && isAllowedThumbnailUrl(rawThumb.trim()) ? rawThumb.trim() : null;
        videos.set(id, { id, title: candidateTitle, url: `/d/${id}`, thumbnailUrl });
      }
      return;
    }
  });

  // Pagination evidence: any anchor pointing at ?p={page+1}. Upstream does
  // not always expose explicit next/previous controls, so presence of the
  // parameter link is the only trusted signal. Without evidence we keep null
  // and the UI disables the "next" button.
  let hasNextPage: boolean | null = null;
  const nextPage = String(options.page + 1);
  $("a[href]").each((_index, element) => {
    if (hasNextPage === true) return;
    const href = $(element).attr("href");
    if (!href) return;
    const resolved = normalizeUrl(href, options.baseUrl);
    if (!resolved) return;
    try {
      const parsed = new URL(resolved);
      if (parsed.searchParams.get("p") === nextPage) {
        hasNextPage = true;
      }
    } catch {
      // ignore malformed hrefs
    }
  });

  return {
    title,
    folders: [...folders.values()],
    videos: [...videos.values()],
    hasNextPage,
  };
}

/**
 * Extract the raw embed token from a video detail page. Supports
 * var/let/const declarations with single or double quotes and arbitrary
 * whitespace. The token value is never logged by callers.
 */
export function extractEmbedToken(html: string): string | null {
  for (const pattern of EMBED_TOKEN_PATTERNS) {
    const match = html.match(pattern);
    if (match?.[2] && match[2].length >= 8) {
      return match[2];
    }
  }
  return null;
}

/**
 * Decode the first (Base64URL) segment of a two-part token, add padding as
 * needed, parse JSON and validate the payload with Zod. Returns null when
 * anything is malformed instead of throwing.
 */
export function decodeEmbedToken(token: string): EmbedTokenPayload | null {
  const firstSegment = token.split(".")[0];
  if (!firstSegment || firstSegment.length < 8) return null;

  let base64 = firstSegment.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = base64.length % 4;
  if (remainder === 3) base64 += "=";
  else if (remainder === 2) base64 += "==";
  else if (remainder === 1) return null;

  try {
    const json = Buffer.from(base64, "base64").toString("utf8");
    const raw: unknown = JSON.parse(json);
    const result = embedPayloadSchema.safeParse(raw);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Parse candidate playback sources from the fallback stream.php page. */
export function parseFallbackSources(html: string): string[] {
  const $ = cheerio.load(html);
  const candidates: string[] = [];
  const push = (raw?: string | null): void => {
    if (!raw) return;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return;
    const lower = trimmed.toLowerCase();
    if (lower === "javascript:" || lower.startsWith("javascript:") || lower.startsWith("data:")) return;
    candidates.push(trimmed);
  };

  // Do not rely on the `type` attribute: upstream markup may omit it.
  $("source").each((_index, element) => push($(element).attr("src")));
  $("video[src]").each((_index, element) => push($(element).attr("src")));

  return candidates;
}

/** Extract the human-facing page title (used as a fallback video title). */
export function extractPageTitle(html: string): string | null {
  try {
    const $ = cheerio.load(html);
    return extractTitleFromDocument($);
  } catch {
    return null;
  }
}

/**
 * The upstream serves "not found" pages with HTTP 200. Detect the signature
 * title/content so the client layer can map it to a proper 404 instead of
 * rendering a broken listing.
 */
export function isUpstreamNotFoundPage(html: string): boolean {
  const title = extractPageTitle(html);
  if (title && /404\s*page\s*not\s*found/i.test(title)) return true;
  if (/404\s*page\s*not\s*found/i.test(html.slice(0, 4000))) return true;
  return false;
}
