import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/urls";

/**
 * Robots policy. Content pages (folders, watch, search) are intentionally
 * excluded from indexing because the application does not own the upstream
 * content and cannot guarantee indexing permission. Only the homepage and
 * legal pages are indexable.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/terms", "/privacy", "/copyright", "/contact"],
        disallow: ["/api/", "/watch/", "/folder/", "/search"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
