import { fetchLatestCatalogVideos } from "@/server/providers/streamrizz/catalog";
import { siteUrl, watchPath } from "@/lib/urls";

/**
 * RSS 2.0 feed of the latest catalog videos (professional tube sites expose
 * feeds for syndication and content discovery). Items come from the newest
 * sub-folders' first pages via the shared cached catalog helper; the feed
 * degrades to an empty channel when the upstream is unreachable.
 *
 * Marked noindex via X-Robots-Tag and ISR-cached for 30 minutes.
 */

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
     
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

export async function GET(): Promise<Response> {
  const base = siteUrl();
  const videos = await fetchLatestCatalogVideos(6, 4);
  const buildDate = new Date().toUTCString();

  const items = videos
    .map((video) => {
      const link = `${base}${watchPath(video.id)}`;
      const enclosure = video.thumbnailUrl
        ? `<enclosure url="${escapeXml(video.thumbnailUrl)}" type="image/jpeg" length="0"/>`
        : "";
      return [
        "<item>",
        `<title>${escapeXml(video.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `<description>${escapeXml(video.title)} - video viral indo 18+ terbaru di videytube.</description>`,
        enclosure,
        "</item>",
      ].join("");
    })
    .join("");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>videytube - Video Viral Indo 18+ Terbaru</title>`,
    `<link>${escapeXml(base + "/")}</link>`,
    `<description>Koleksi video viral indo 18+ terbaru, diperbarui setiap hari. Streaming cepat dan langsung dari browser.</description>`,
    `<language>id-ID</language>`,
    `<lastBuildDate>${buildDate}</lastBuildDate>`,
    "<ttl>60</ttl>",
    items,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=600",
      "X-Robots-Tag": "noindex",
    },
  });
}
