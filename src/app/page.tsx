import type { Metadata } from "next";
import { HomeView } from "@/components/home/HomeView";
import { fetchFolder } from "@/server/providers/streamrizz/upstream-client";
import { PUBLIC_ROOT_FOLDER_ID } from "@/lib/public-config";
import { folderPath, siteUrl, watchPath } from "@/lib/urls";

export const metadata: Metadata = {
  // No explicit title: the root layout's `title.default`
  // ("videytube - Nonton Video Viral Indo 18+ Terbaru") applies to the home page.
  description:
    "Nonton video viral indo 18+ terbaru gratis di videytube. Koleksi porn indo viral dan video dewasa terlengkap, diperbarui setiap hari. Streaming cepat dan langsung dari browser.",
  keywords: [
    "video viral indo",
    "porn indo viral",
    "video viral terbaru",
    "video 18+ terbaru",
    "nonton video dewasa",
    "viral indo terbaru",
  ],
  alternates: { canonical: "/" },
};

/**
 * Home structured data: an ItemList of the current catalog snapshot (latest
 * folders, plus videos when the root page contains any). Mirrors the
 * ItemList/CollectionPage markup professional tube sites ship on their
 * landing pages so search engines can surface list/carousel results.
 * Rendered server-side from the shared cached listing — no visual change.
 */
async function HomeItemListJsonLd() {
  const base = siteUrl();
  let items: Array<{ url: string; name: string }> = [];

  try {
    const root = await fetchFolder(PUBLIC_ROOT_FOLDER_ID, 1);
    if (root.videos.length > 0) {
      items = root.videos.slice(0, 30).map((video) => ({
        url: `${base}${watchPath(video.id)}`,
        name: video.title ?? video.id,
      }));
    } else {
      items = root.folders.slice(0, 30).map((folder) => ({
        url: `${base}${folderPath(folder.id)}`,
        name: folder.name,
      }));
    }
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
          name: "Koleksi viral terbaru",
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

export default async function HomePage() {
  return (
    <>
      <HomeItemListJsonLd />
      <HomeView />
    </>
  );
}
