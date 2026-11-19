import type { Metadata } from "next";
import { Suspense } from "react";
import { VideyWatchView } from "@/components/videy/VideyWatchView";
import { SkeletonPlayer } from "@/components/ui/SkeletonCard";
import { getProvider } from "@/server/providers/registry";
import { siteUrl, videyHomePath, videyVideoStreamPath, videyWatchPath } from "@/lib/urls";

/**
 * Platform-2 watch pages are indexable content surfaces. Metadata is
 * generated from the cached videy detail with VideoObject-flavoured Open
 * Graph tags, mirroring the main watch page SEO pattern.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<Metadata> {
  const { videoId } = await params;
  const canonical = `${siteUrl()}${videyWatchPath(videoId)}`;
  const fallbackTitle = "Video viral 18+";
  const fallbackDescription =
    "Tonton video viral terbaru dari platform kedua videytube. Streaming cepat, ringan, dan langsung dari browser tanpa gangguan.";

  let title = fallbackTitle;
  let description = fallbackDescription;
  let thumbnailUrl: string | null = null;
  let durationSeconds: number | null = null;

  try {
    const video = await getProvider("videy").getVideoDetail(videoId);
    if (video.title && video.title.trim().length > 0) {
      title = video.title.trim();
      description = `Tonton "${title}" - video viral terbaru dari platform kedua di videytube. Streaming cepat dan ringan, langsung dari browser tanpa gangguan.`;
    }
    thumbnailUrl = video.thumbnailUrl ?? null;
    durationSeconds = video.duration ?? null;
  } catch {
    // Upstream hiccup must not break rendering; fall back to generic copy.
  }

  // Open Graph images must be absolute; resolve site-relative thumbnails.
  const absoluteThumb =
    thumbnailUrl && thumbnailUrl.startsWith("/") ? `${siteUrl()}${thumbnailUrl}` : thumbnailUrl;

  return {
    title,
    description,
    keywords: ["videytube 2", "video viral terbaru", "video viral indo", "nonton video 18+"],
    alternates: { canonical },
    openGraph: {
      type: "video.other",
      siteName: "videytube",
      locale: "id_ID",
      url: canonical,
      title: `${title} | videytube`,
      description,
      images: absoluteThumb ? [{ url: absoluteThumb, width: 640, height: 360, alt: title }] : undefined,
      videos: [
        {
          // Open Graph requires absolute URLs; metadataBase does not resolve
          // the `videos` array automatically.
          url: `${siteUrl()}${videyVideoStreamPath(videoId)}`,
          width: 640,
          height: 360,
          type: "video/mp4",
        },
      ],
    },
    twitter: {
      card: absoluteThumb ? "summary_large_image" : "summary",
      title: `${title} | videytube`,
      description,
      images: absoluteThumb ? [absoluteThumb] : undefined,
    },
    robots: { index: true, follow: true },
    other: durationSeconds && durationSeconds > 0 ? { "video:duration": String(durationSeconds) } : undefined,
  };
}

function iso8601Duration(seconds: number): string {
  const safe = Math.max(1, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `PT${minutes}M${rest}S`;
}

/**
 * Watch-page structured data for platform 2: schema.org VideoObject plus a
 * BreadcrumbList (Beranda > videytube 2 > video). uploadDate uses the
 * upstream fetch timestamp; no fabricated publish dates. Rendered
 * server-side from the cached detail; no visual change to the page.
 */
async function VideyWatchStructuredData({ videoId }: { videoId: string }) {
  const base = siteUrl();
  const watchUrl = `${base}${videyWatchPath(videoId)}`;

  let title = "Video viral 18+";
  let description =
    "Tonton video viral terbaru dari platform kedua videytube. Streaming cepat, ringan, dan langsung dari browser tanpa gangguan.";
  let thumbnailUrl: string | null = null;
  let durationSeconds: number | null = null;
  let fetchedAt: string | null = null;

  try {
    const video = await getProvider("videy").getVideoDetail(videoId);
    if (video.title && video.title.trim().length > 0) title = video.title.trim();
    description = `Tonton "${title}" - video viral terbaru dari platform kedua di videytube. Streaming cepat dan ringan, langsung dari browser tanpa gangguan.`;
    thumbnailUrl = video.thumbnailUrl ?? null;
    durationSeconds = video.duration ?? null;
    fetchedAt = video.fetchedAt;
  } catch {
    // Keep fallback copy; structured data still renders the page entity.
  }

  const videoObject: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description,
    url: watchUrl,
    embedUrl: watchUrl,
    isFamilyFriendly: false,
    inLanguage: "id-ID",
    ...(thumbnailUrl ? { thumbnailUrl: [thumbnailUrl] } : {}),
    ...(durationSeconds && durationSeconds > 0 ? { duration: iso8601Duration(durationSeconds) } : {}),
    ...(fetchedAt ? { uploadDate: fetchedAt } : {}),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: "videytube 2", item: `${base}${videyHomePath()}` },
      { "@type": "ListItem", position: 3, name: title, item: watchUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObject) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
    </>
  );
}

function VideyWatchPageFallback() {
  return (
    <div className="mx-auto w-full max-w-4xl" aria-hidden>
      <div className="mb-5 h-4 w-56 rounded bg-muted animate-pulse" />
      <SkeletonPlayer />
    </div>
  );
}

export default async function VideyWatchPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  return (
    <Suspense fallback={<VideyWatchPageFallback />}>
      <VideyWatchStructuredData videoId={videoId} />
      <VideyWatchView videoId={videoId} />
    </Suspense>
  );
}
