import type { MetadataRoute } from "next";
import { fetchFolder } from "@/server/upstream/upstream-client";
import { PUBLIC_ROOT_FOLDER_ID } from "@/lib/public-config";
import { folderPath, siteUrl, watchPath } from "@/lib/urls";

/**
 * Dynamic sitemap. Static legal pages are always included; catalog entries
 * (root folders + their videos, first page) are added from the cached
 * upstream listing when reachable. If the upstream is unavailable the
 * sitemap still renders with the static pages instead of failing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/copyright`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const root = await fetchFolder(PUBLIC_ROOT_FOLDER_ID, 1);
    const folderEntries: MetadataRoute.Sitemap = root.folders.map((folder) => ({
      url: `${base}${folderPath(folder.id)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
    const videoEntries: MetadataRoute.Sitemap = root.videos.map((video) => ({
      url: `${base}${watchPath(video.id)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
    return [...staticEntries, ...folderEntries, ...videoEntries];
  } catch {
    // Upstream unreachable: static-only sitemap keeps the endpoint healthy.
    return staticEntries;
  }
}
