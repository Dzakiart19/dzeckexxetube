import type { Metadata } from "next";
import { Suspense } from "react";
import { FolderView } from "@/components/folders/FolderView";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { fetchFolder } from "@/server/upstream/upstream-client";
import { folderPath, parsePageNumber, siteUrl } from "@/lib/urls";

/**
 * Folder pages are the "category" surfaces of the site, so they are
 * indexable. Titles/descriptions are generated from the folder's upstream
 * title (served from cache) so search engines see meaningful text.
 * Paginated views use self-canonical URLs with `?page=N` (page 1 canonical
 * is the bare path) — the same per-page canonical pattern professional tube
 * sites use for category pagination.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ folderId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { folderId } = await params;
  const query = await searchParams;
  const page =
    typeof query.page === "string" ? parsePageNumber(query.page) : 1;
  const canonical = folderPath(folderId, page);
  const fallbackDescription =
    "Jelajahi koleksi video viral indo 18+ terbaru dalam folder ini. Nonton video dewasa terbaru langsung di browser, cepat dan tanpa gangguan.";

  let title = "Koleksi video viral";
  let description = fallbackDescription;
  let firstVideoThumbnail: string | null = null;
  try {
    const folder = await fetchFolder(folderId, 1);
    if (folder.title && folder.title.trim().length > 0) {
      title = folder.title.trim();
      description = `Koleksi video viral indo 18+ di folder "${title}". Nonton video dewasa terbaru langsung di browser, streaming cepat dan tanpa gangguan.`;
    }
    firstVideoThumbnail = folder.videos.find((video) => video.thumbnailUrl)?.thumbnailUrl ?? null;
  } catch {
    // Upstream hiccup must not break rendering; fall back to generic copy.
  }

  // Prefer the folder's own video thumbnail for social sharing; fall back to
  // the branded default OG image so shares never render without a picture.
  const ogImage = firstVideoThumbnail
    ? [{ url: firstVideoThumbnail, width: 640, height: 360, alt: title }]
    : [{ url: "/og-default.png", width: 1200, height: 630, alt: "videytube - Nonton Video Viral Indo 18+ Terbaru" }];

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
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | videytube`,
      description,
      images: [firstVideoThumbnail ?? "/og-default.png"],
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Folder structured data: BreadcrumbList (Beranda > folder) rendered
 * server-side from the cached listing; invisible, no visual change.
 */
async function FolderBreadcrumbJsonLd({ folderId }: { folderId: string }) {
  let title = "Koleksi video viral";
  try {
    const folder = await fetchFolder(folderId, 1);
    if (folder.title && folder.title.trim().length > 0) title = folder.title.trim();
  } catch {
    // Fallback title above is already safe.
  }
  const base = siteUrl();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Beranda", item: `${base}/` },
            { "@type": "ListItem", position: 2, name: title, item: `${base}${folderPath(folderId)}` },
          ],
        }),
      }}
    />
  );
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
    <>
      <Suspense fallback={null}>
        <FolderBreadcrumbJsonLd folderId={folderId} />
      </Suspense>
      <Suspense fallback={<FolderPageFallback />}>
        <FolderView folderId={folderId} />
      </Suspense>
    </>
  );
}
