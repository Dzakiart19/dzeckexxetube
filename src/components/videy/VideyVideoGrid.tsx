import { VideyVideoCard, type VideyVideoSummary } from "@/components/videy/VideyVideoCard";
import type { VideySort } from "@/lib/urls";

interface VideyVideoGridProps {
  videos: VideyVideoSummary[];
  /** Active sort, forwarded to every card's watch URL. */
  sort?: VideySort;
}

/** Platform-2 responsive grid: 2 columns mobile, 3-4 tablet, up to 6 desktop. */
export function VideyVideoGrid({ videos, sort }: VideyVideoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {videos.map((video) => (
        <VideyVideoCard key={video.id} video={video} sort={sort} />
      ))}
    </div>
  );
}
