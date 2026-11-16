import type { Metadata } from "next";
import { Suspense } from "react";
import { WatchView } from "@/components/videos/WatchView";
import { SkeletonPlayer } from "@/components/ui/SkeletonCard";

export const metadata: Metadata = {
  title: "Tonton",
  description: "Putar video dengan pemutar yang ringan dan responsif.",
  robots: { index: false, follow: false },
};

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
