import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/urls";

/**
 * robots.txt: crawl everything except internals and search result pages.
 * The sitemap is referenced with its absolute production URL so the file
 * already works once the domain is live.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/search"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
