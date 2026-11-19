import * as cheerio from "cheerio";
import type { VideoSummary } from "@/lib/types";

/**
 * Tolerant HTML parsing for the videy platform (platform 2).
 *
 * Verified upstream structure:
 *  - listing: `.video-card` > `a[href="watch.php?id=N"]` > `img[alt=title]`,
 *    `.video-title`, views span (fa-eye), `.duration` ("mm:ss" | "h:mm:ss")
 *  - pagination: `.page-info` ("N of M") + `a.pagination-btn[href*="page=N+1"]`
 *  - watch: `<video poster=...>` + `<source src="uploads/videos/vid_*.mp4">`
 *  - missing content: `.error-title` "Video tidak ditemukan" (HTTP 200!)
 */

const ID_PATTERN = /watch\.php\?id=([A-Za-z0-9_-]{1,64})/;
const PAGE_TITLE_SUFFIX = /\s*-\s*Videy\s*Design.*$/i;

/** Parse "06:24" or "1:02:33" into seconds; null when unparseable. */
export function parseDuration(raw: string): number | null {
  const parts = raw.trim().split(":").map((part) => Number(part));
  if (parts.length < 2 || parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  let seconds = 0;
  for (const part of parts) seconds = seconds * 60 + part;
  return seconds > 0 ? seconds : null;
}

/** Parse "26,386" / "1.024" / "987" into a number; null when unparseable. */
export function parseViews(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function absolutize(raw: string | null | undefined, baseUrl: string): string | null {
  if (!raw || raw.length === 0) return null;
  if (/^(https?:)?\/\//i.test(raw) && !raw.startsWith("//")) return raw;
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return null;
  }
}

function cleanText(raw: string | undefined | null): string {
  if (!raw) return "";
  return raw.replace(/\s+/g, " ").trim();
}

/** Detect the HTTP-200 "not found" page rendered for missing content. */
export function isVideyNotFoundPage(html: string): boolean {
  return /class="error-title"[^>]*>\s*Video tidak ditemukan/i.test(html);
}

export interface VideyListParseResult {
  videos: VideoSummary[];
  hasNextPage: boolean | null;
  totalPages: number | null;
}

export function parseVideyList(
  html: string,
  options: { page: number; sort: string; baseUrl: string },
): VideyListParseResult {
  const $ = cheerio.load(html);
  const videos = new Map<string, VideoSummary>();

  $("div.video-card").each((_index, element) => {
    const card = $(element);
    const href = card.find("a[href*='watch.php?id=']").attr("href");
    const match = href ? ID_PATTERN.exec(href) : null;
    if (!match) return;
    const id = match[1];
    if (videos.has(id)) return;

    const title =
      cleanText(card.find(".video-title").first().text()) ||
      cleanText(card.find(".video-thumbnail img").attr("alt")) ||
      null;
    const thumbRaw = card.find("img").first().attr("src");
    const thumbnailUrl = absolutize(thumbRaw, options.baseUrl);
    const durationRaw = cleanText(card.find(".duration").first().text());
    const duration = parseDuration(durationRaw);
    const viewsRaw = cleanText(
      card
        .find(".video-meta span")
        .filter((_i, span) => $(span).find("i.fa-eye").length > 0)
        .first()
        .text(),
    );
    const views = parseViews(viewsRaw);

    videos.set(id, {
      id,
      title,
      url: `/watch.php?id=${id}`,
      thumbnailUrl,
      duration,
      views,
    });
  });

  // Pagination: "N of M" is authoritative; the Next link is a fallback.
  const pageInfo = cleanText($(".page-info").first().text());
  let hasNextPage: boolean | null = null;
  let totalPages: number | null = null;
  const rangeMatch = /(\d+)\s*(?:of|\/|dari)\s*(\d+)/i.exec(pageInfo);
  if (rangeMatch) {
    const current = Number(rangeMatch[1]);
    const total = Number(rangeMatch[2]);
    if (Number.isFinite(current) && Number.isFinite(total) && total >= current) {
      totalPages = total;
      hasNextPage = current < total;
    }
  }
  if (hasNextPage === null) {
    const nextHref = $("a.pagination-btn")
      .toArray()
      .map((el) => $(el).attr("href") ?? "")
      .find((href) => href.includes(`page=${options.page + 1}`));
    hasNextPage = Boolean(nextHref);
  }

  return { videos: Array.from(videos.values()), hasNextPage, totalPages };
}

export interface VideyWatchParseResult {
  title: string;
  thumbnailUrl: string | null;
  sourceUrl: string | null;
  duration: number | null;
  views: number | null;
}

export function parseVideyWatch(
  html: string,
  options: { videoId: string; baseUrl: string },
): VideyWatchParseResult {
  const $ = cheerio.load(html);

  const docTitle = cleanText($("title").first().text()).replace(PAGE_TITLE_SUFFIX, "").trim();
  // The real title lives in .video-title (h1 or div). The bare <h1> in the
  // header is the site logo ("VideyDesign") and must not be picked up.
  const inlineTitle = cleanText($(".video-title").first().text());
  const title = inlineTitle || docTitle || options.videoId;

  const video = $("video#videoPlayer, video").first();
  const posterRaw = video.attr("poster");
  const thumbnailUrl = absolutize(posterRaw, options.baseUrl);

  // <source src> wins; <video src> is the fallback. Attribute `type` is not trusted.
  const sourceRaw =
    video.find("source").first().attr("src") ??
    video.attr("src") ??
    $("source[src]").first().attr("src") ??
    null;
  const sourceUrl = absolutize(sourceRaw, options.baseUrl);

  const duration = parseDuration(cleanText(video.attr("data-duration") ?? ""));
  const viewsRaw = cleanText(
    $("span")
      .filter((_i, span) => $(span).find("i.fa-eye").length > 0)
      .first()
      .text(),
  );
  const views = parseViews(viewsRaw);

  return { title, thumbnailUrl, sourceUrl, duration, views };
}
