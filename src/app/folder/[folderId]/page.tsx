import type { Metadata } from "next";
import { Suspense } from "react";
import { FolderView } from "@/components/folders/FolderView";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { fetchFolder } from "@/server/upstream/upstream-client";
import { folderPath } from "@/lib/urls";

/**
 * Folder pages are the "category" surfaces of the site, so they are
 * indexable. Titles/descriptions are generated from the folder's upstream
 * title (served from cache) so search engines see meaningful text.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ folderId: string }>;
}): Promise<Metadata> {
  const { folderId } = await params;
  const canonical = folderPath(folderId);
  const fallbackDescription =
    "Jelajahi koleksi video viral indo 18+ terbaru dalam folder ini. Nonton video dewasa terbaru langsung di browser, cepat dan tanpa gangguan.";

  let title = "Koleksi video viral";
  let description = fallbackDescription;
  try {
    const folder = await fetchFolder(folderId, 1);
    if (folder.title && folder.title.trim().length > 0) {
      title = folder.title.trim();
      description = `Koleksi video viral indo 18+ di folder "${title}". Nonton video dewasa terbaru langsung di browser, streaming cepat dan tanpa gangguan.`;
    }
  } catch {
    // Upstream hiccup must not break rendering; fall back to generic copy.
  }

  return {
    title,
    description,
    keywords: ["video viral indo", "video 18+ terbaru", "video dewasa", "folder viral"],
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: "videytube",
      locale: "id_ID",
      url: canonical,
      title: `${title} | videytube`,
      description,
    },
    twitter: {
      card: "summary",
      title: `${title} | videytube`,
      description,
    },
    robots: { index: true, follow: true },
  };
}

function FolderPageFallback() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="h-8 w-64 rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-48 rounded-md bg-muted animate-pulse" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_item, index) => (
          <SkeletonCard key={index} variant="video" />
        ))}
      </div>
    </div>
  );
}

export default async function FolderPage({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params;
  return (
    <Suspense fallback={<FolderPageFallback />}>
      <FolderView folderId={folderId} />
    </Suspense>
  );
}
