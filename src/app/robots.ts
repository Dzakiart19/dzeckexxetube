import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/urls";

/**
 * Robots policy. Moderated content pages (folders, watch) are indexable;
 * search result pages are thin/duplicated and stay out of the index; the
 * report/copyright forms and the internal API are excluded as well.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/explore", "/category/", "/folder/", "/watch/", "/sources"],
        disallow: ["/api/", "/search", "/report", "/copyright"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
