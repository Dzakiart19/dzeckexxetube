import type { Metadata } from "next";
import { Suspense } from "react";
import { WatchView } from "@/components/videos/WatchView";
import { SkeletonPlayer } from "@/components/ui/SkeletonCard";
import { fetchVideoDetail } from "@/server/upstream/upstream-client";
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
      <WatchView videoId={videoId} />
    </Suspense>
  );
}
