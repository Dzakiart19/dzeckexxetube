import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  variant?: "video" | "folder";
}

/** Loading placeholder matching the shape of video/folder cards. */
export function SkeletonCard({ variant = "video" }: SkeletonCardProps) {
  if (variant === "folder") {
    return (
      <div className="flex min-h-[72px] items-center gap-3 rounded-lg border border-border bg-card p-4" aria-hidden>
        <Skeleton className="size-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/** Full-width player placeholder used on the watch page. */
export function SkeletonPlayer() {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-card" aria-hidden>
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-4 w-44" />
      </div>
    </div>
  );
}
