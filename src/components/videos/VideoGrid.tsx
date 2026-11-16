import { VideoCard, type VideoCardView } from "@/components/videos/VideoCard";

interface VideoGridProps {
  videos: VideoCardView[];
  locked: boolean;
  /** Number of skeleton-free grid columns variant (default catalog grid). */
  compact?: boolean;
}

/**
 * Responsive video grid: 2 columns on small phones up to 5 on desktop.
 * Pure server component; interactivity lives inside VideoCard.
 */
export function VideoGrid({ videos, locked, compact = false }: VideoGridProps) {
  return (
    <div
      className={
        compact
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
          : "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5"
      }
    >
      {videos.map((video) => (
        <VideoCard key={video.slug} video={video} locked={locked} />
      ))}
    </div>
  );
}
