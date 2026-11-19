"use client";

import { Film, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { VideyListData } from "@/hooks/use-videy";
import { videyWatchPath, type VideySort } from "@/lib/urls";

/** One video entry from the videy (platform 2) listing API. */
export type VideyVideoSummary = VideyListData["videos"][number];

interface VideyVideoCardProps {
  video: VideyVideoSummary;
  /** Active sort, forwarded to the watch URL so "back to list" keeps context. */
  sort?: VideySort;
}

/**
 * Format seconds as mm:ss (minutes zero-padded, e.g. "04:35").
 * Returns null when the duration is unusable so the badge can be hidden.
 */
function formatDurationBadge(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(rest)}`;
  return `${pad(minutes)}:${pad(rest)}`;
}

/** "N tayangan" in Indonesian number formatting; null hides the row. */
function formatViewsLabel(views: number | null | undefined): string | null {
  if (views == null || !Number.isFinite(views) || views < 0) return null;
  return `${new Intl.NumberFormat("id-ID").format(views)} tayangan`;
}

/**
 * Platform-2 video card: fixed 16:9 thumbnail (no layout shift), duration
 * badge, hover play overlay, and a compact views row. Mirrors VideoCard.
 */
export function VideyVideoCard({ video, sort }: VideyVideoCardProps) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumb = Boolean(video.thumbnailUrl) && !thumbFailed;
  const durationLabel = formatDurationBadge(video.duration);
  const viewsLabel = formatViewsLabel(video.views);

  return (
    <Link
      href={videyWatchPath(video.id, sort)}
      className="group block rounded-lg focus-visible:outline-none"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted transition-colors duration-200 group-hover:border-primary/40">
        {showThumb ? (
          <img
            src={video.thumbnailUrl as string}
            alt={video.title ? `Thumbnail video ${video.title}` : "Thumbnail video"}
            loading="lazy"
            decoding="async"
            onError={() => setThumbFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/60">
            <Film className="size-8 text-muted-foreground/60" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Play className="size-5 translate-x-0.5 fill-current" aria-hidden />
          </span>
        </div>
        {durationLabel && (
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] leading-none font-medium tabular-nums text-foreground">
            {durationLabel}
          </span>
        )}
      </div>
      <p className="mt-2.5 line-clamp-2 text-sm leading-snug text-foreground/90 transition-colors group-hover:text-foreground">
        {video.title ?? video.id}
      </p>
      {viewsLabel && <p className="mt-1 text-xs text-muted-foreground">{viewsLabel}</p>}
    </Link>
  );
}
