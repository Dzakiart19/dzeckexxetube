import type { Metadata } from "next";
import { Suspense } from "react";
import { WatchView } from "@/components/videos/WatchView";
import { SkeletonPlayer } from "@/components/ui/SkeletonCard";
import { fetchVideoDetail } from "@/server/providers/streamrizz/upstream-client";
import { siteUrl, videoStreamPath, watchPath } from "@/lib/urls";

/**
 * Watch pages are the primary content surfaces and are indexable. Metadata
 * is generated from the cached video detail (title, thumbnail, duration)
 * with VideoObject-flavoured Open Graph tags, following the professional
 * adult tube-site SEO pattern.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<Metadata> {
  const { videoId } = await params;
  const canonical = watchPath(videoId);
  const fallbackTitle = "Video viral 18+";
  const fallbackDescription =
    "Tonton video viral indo 18+ terbaru di videytube. Streaming cepat, ringan, dan langsung dari browser tanpa gangguan.";

  let title = fallbackTitle;
  let description = fallbackDescription;
  let thumbnailUrl: string | null = null;
  let durationSeconds: number | null = null;

  try {
    const video = await fetchVideoDetail(videoId);
    if (video.title && video.title.trim().length > 0) {
      title = video.title.trim();
      description = `Tonton "${title}" - video viral indo 18+ terbaru di videytube. Streaming cepat dan ringan, langsung dari browser tanpa gangguan.`;
    }
    thumbnailUrl = video.thumbnailUrl ?? null;
    durationSeconds = video.duration ?? null;
  } catch {
    // Upstream hiccup must not break rendering; fall back to generic copy.
  }

  return {
    title,
    description,
    keywords: ["video viral indo", "video 18+ terbaru", "nonton video dewasa", "video viral terbaru"],
    alternates: { canonical },
    openGraph: {
      type: "video.other",
      siteName: "videytube",
      locale: "id_ID",
      url: canonical,
      title: `${title} | videytube`,
      description,
      images: thumbnailUrl ? [{ url: thumbnailUrl, width: 640, height: 360, alt: title }] : undefined,
      videos: [
        {
          // Open Graph requires absolute URLs; metadataBase does not resolve
          // the `videos` array automatically.
          url: `${siteUrl()}${videoStreamPath(videoId)}`,
          width: 640,
          height: 360,
          type: "video/mp4",
        },
      ],
    },
    twitter: {
      card: thumbnailUrl ? "summary_large_image" : "summary",
      title: `${title} | videytube`,
      description,
      images: thumbnailUrl ? [thumbnailUrl] : undefined,
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
 * Watch-page structured data: schema.org VideoObject (required for Google
 * video rich results; the core of xnxx/pornhub-style video SEO) plus a
 * BreadcrumbList for crawl context. uploadDate is intentionally omitted
 * because the upstream exposes no trustworthy publish date — fabricated
 * dates would violate structured-data guidelines. Rendered server-side
 * from the cached detail; no visual change to the page.
 */
async function WatchStructuredData({ videoId }: { videoId: string }) {
  const base = siteUrl();
  const watchUrl = `${base}${watchPath(videoId)}`;

  let title = "Video viral 18+";
  let description =
    "Tonton video viral indo 18+ terbaru di videytube. Streaming cepat, ringan, dan langsung dari browser tanpa gangguan.";
  let thumbnailUrl: string | null = null;
  let durationSeconds: number | null = null;

  try {
    const video = await fetchVideoDetail(videoId);
    if (video.title && video.title.trim().length > 0) title = video.title.trim();
    description = `Tonton "${title}" - video viral indo 18+ terbaru di videytube. Streaming cepat dan ringan, langsung dari browser tanpa gangguan.`;
    thumbnailUrl = video.thumbnailUrl ?? null;
    durationSeconds = video.duration ?? null;
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
    ...(durationSeconds && durationSeconds > 0
      ? { duration: iso8601Duration(durationSeconds) }
      : {}),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: title, item: watchUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObject) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
    </>
  );
}

function WatchPageFallback() {
  return (
    <div className="mx-auto w-full max-w-4xl" aria-hidden>
      <div className="mb-5 h-4 w-56 rounded bg-muted animate-pulse" />
      <SkeletonPlayer />
    </div>
  );
}

export default async function WatchPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  return (
    <Suspense fallback={<WatchPageFallback />}>
      <WatchStructuredData videoId={videoId} />
      <WatchView videoId={videoId} />
    </Suspense>
  );
}
