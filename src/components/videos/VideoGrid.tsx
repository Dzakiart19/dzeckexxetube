import { VideoCard } from "@/components/videos/VideoCard";
import type { VideoSummary } from "@/lib/types";

interface VideoGridProps {
  videos: VideoSummary[];
  from?: string;
}

/** Responsive video grid: 2 columns mobile, 3-4 tablet, up to 6 desktop. */
export function VideoGrid({ videos, from }: VideoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} from={from} />
      ))}
    </div>
  );
}
