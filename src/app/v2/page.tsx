import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { VideyHomeView } from "@/components/videy/VideyHomeView";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { getProvider } from "@/server/providers/registry";
import { siteUrl, videyWatchPath } from "@/lib/urls";

export function generateMetadata(): Metadata {
  const title = "videytube 2";
  const description = "Video viral terbaru dari platform kedua di videytube.";

  return {
    title,
    description,
    keywords: ["videytube 2", "video viral terbaru", "video viral indo", "video 18+ terbaru"],
    alternates: { canonical: `${siteUrl()}/v2` },
    openGraph: {
      type: "website",
      siteName: "videytube",
      locale: "id_ID",
      url: `${siteUrl()}/v2`,
      title: `${title} | videytube`,
      description,
      images: [
        { url: "/og-default.png", width: 1200, height: 630, alt: `${title} - Video viral terbaru` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | videytube`,
      description,
      images: ["/og-default.png"],
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Platform-2 structured data: an ItemList of the latest videy videos so
 * search engines can surface list results for the second platform. Rendered
 * server-side from the cached listing; silently skipped on upstream hiccups.
 */
async function VideyItemListJsonLd() {
  const base = siteUrl();
  let items: Array<{ url: string; name: string }> = [];

  try {
    const discovery = await getProvider("videy").getDiscovery({ page: 1, sort: "terbaru" });
    items = discovery.videos.slice(0, 30).map((video) => ({
      url: `${base}${videyWatchPath(video.id)}`,
      name: video.title ?? video.id,
    }));
  } catch {
    // Upstream hiccup: skip structured data instead of failing the page.
  }

  if (items.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Video viral terbaru dari sumber kedua",
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          numberOfItems: items.length,
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            url: item.url,
          })),
        }),
      }}
    />
  );
}

function VideyPageFallback() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      <div className="h-8 w-72 rounded-md bg-muted animate-pulse" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 8 }).map((_item, index) => (
          <SkeletonCard key={index} variant="video" />
        ))}
      </div>
    </div>
  );
}

export default function VideyHomePage() {
  return (
    <>
      <VideyItemListJsonLd />
      <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: "videytube 2" }]} />
      <Suspense fallback={<VideyPageFallback />}>
        <VideyHomeView />
      </Suspense>
    </>
  );
}
