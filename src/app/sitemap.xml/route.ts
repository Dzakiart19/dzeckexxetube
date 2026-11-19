import { fetchFolder } from "@/server/providers/streamrizz/upstream-client";
import { fetchLatestCatalogVideos } from "@/server/providers/streamrizz/catalog";
import { getProvider } from "@/server/providers/registry";
import { PUBLIC_ROOT_FOLDER_ID } from "@/lib/public-config";
import { folderPath, siteUrl, videyWatchPath, watchPath } from "@/lib/urls";

/**
 * Dynamic sitemap with the Google Video Sitemap extension, following the
 * professional tube-site pattern (xnxx/pornhub style):
 * - static legal pages + all root sub-folders as plain URL entries
 * - latest videos as `video:video` entries (thumbnail, title, player URL,
 *   family-friendly=no) so they are eligible for Google video search
 *
 * Rendered as a raw XML route handler because Next's `MetadataRoute.Sitemap`
 * cannot express the video namespace. Output is ISR-cached (30 minutes) to
 * keep upstream load bounded; upstream failures degrade to folder-only or
 * static-only output instead of an error page.
 */

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VIDEO_NS = "http://www.google.com/schemas/sitemap-video/1.1";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Strip control characters that are illegal in XML 1.0.
     
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

/** Crawlable URL entry without video data. */
function urlEntry(loc: string, changeFrequency: string, priority: number, lastmod: string): string {
  return [
    "<url>",
    `<loc>${escapeXml(loc)}</loc>`,
    `<lastmod>${lastmod}</lastmod>`,
    `<changefreq>${changeFrequency}</changefreq>`,
    `<priority>${priority.toFixed(1)}</priority>`,
    "</url>",
  ].join("");
}

/**
 * Watch-page URL entry with the Google video sitemap extension. The player
 * is the watch page itself; the stream relay is intentionally NOT exposed as
 * content_loc so crawlers do not pull raw video bytes through the proxy.
 */
function videoUrlEntry(
  loc: string,
  title: string,
  thumbnail: string | null,
  lastmod: string,
): string {
  const parts = [
    "<url>",
    `<loc>${escapeXml(loc)}</loc>`,
    `<lastmod>${lastmod}</lastmod>`,
    "<video:video>",
    thumbnail ? `<video:thumbnail_loc>${escapeXml(thumbnail)}</video:thumbnail_loc>` : "",
    `<video:title>${escapeXml(title)}</video:title>`,
    `<video:description>${escapeXml(title)} - video viral indo 18+ terbaru di videytube.</video:description>`,
    `<video:player_loc>${escapeXml(loc)}</video:player_loc>`,
    "<video:family_friendly>no</video:family_friendly>",
    "<video:live>no</video:live>",
    "</video:video>",
    "</url>",
  ];
  return parts.join("");
}

/** Platform 2 catalog helper (bounded to the first two listing pages). */
function getProviderCatalog() {
  return getProvider("videy").getCatalogVideos(40, 4);
}

export async function GET(): Promise<Response> {
  const base = siteUrl();
  const now = new Date().toISOString();
  const entries: string[] = [
    urlEntry(`${base}/`, "daily", 1, now),
    urlEntry(`${base}/v2`, "daily", 0.9, now),
    urlEntry(`${base}/terms`, "yearly", 0.2, now),
    urlEntry(`${base}/privacy`, "yearly", 0.2, now),
    urlEntry(`${base}/copyright`, "yearly", 0.2, now),
    urlEntry(`${base}/contact`, "yearly", 0.2, now),
  ];

  let folders: Array<{ id: string }> = [];
  try {
    const root = await fetchFolder(PUBLIC_ROOT_FOLDER_ID, 1);
    folders = root.folders;
  } catch {
    // Root unreachable: static-only sitemap keeps the endpoint healthy.
  }

  let videos: Awaited<ReturnType<typeof fetchLatestCatalogVideos>> = [];
  if (folders.length > 0) {
    videos = await fetchLatestCatalogVideos(8, 4);
  }

  // Platform 2 (videy): newest listing pages flattened into video entries.
  let videyVideos: Awaited<ReturnType<typeof getProviderCatalog>> = [];
  try {
    videyVideos = await getProviderCatalog();
  } catch {
    // Platform 2 unreachable: platform 1 output stays intact.
  }

  for (const folder of folders) {
    entries.push(urlEntry(`${base}${folderPath(folder.id)}`, "daily", 0.8, now));
  }
  for (const video of videos) {
    entries.push(
      videoUrlEntry(`${base}${watchPath(video.id)}`, video.title, video.thumbnailUrl, now),
    );
  }
  for (const video of videyVideos) {
    entries.push(
      videoUrlEntry(`${base}${videyWatchPath(video.id)}`, video.title, video.thumbnailUrl, now),
    );
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="${VIDEO_NS}">`,
    ...entries,
    "</urlset>",
  ].join("");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=600",
      "X-Robots-Tag": "noindex",
    },
  });
}
