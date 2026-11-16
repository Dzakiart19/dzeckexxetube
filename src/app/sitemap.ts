import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/** Upper bound for catalog entries in the sitemap to keep it lightweight. */
const MAX_VIDEOS = 2000;
const MAX_FOLDERS = 500;

/**
 * Sitemap limited to moderated public pages: static pages, approved folders
 * and approved videos on verified sources. Search, report and admin routes
 * are intentionally excluded (they are noindex or private).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${base}/explore`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/sources`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/adult-content-policy`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/community-guidelines`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/contact`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [folders, videos] = await Promise.all([
      db.folder.findMany({
        where: { status: "APPROVED", videoCount: { gt: 0 }, source: { verified: true, status: "ACTIVE" } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: MAX_FOLDERS,
      }),
      db.video.findMany({
        where: { status: "APPROVED", source: { verified: true, status: "ACTIVE" } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: MAX_VIDEOS,
      }),
    ]);

    return [
      ...staticEntries,
      ...folders.map((folder) => ({
        url: `${base}/folder/${folder.slug}`,
        lastModified: folder.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...videos.map((video) => ({
        url: `${base}/watch/${video.slug}`,
        lastModified: video.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Database unavailable: emit the static pages rather than an error page.
    return staticEntries;
  }
}
