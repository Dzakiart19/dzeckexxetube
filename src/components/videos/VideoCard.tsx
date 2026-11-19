"use client";

import { Film, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { VideoSummary } from "@/lib/types";
import { watchPath } from "@/lib/urls";

interface VideoCardProps {
  video: VideoSummary;
  /** Origin folder id, forwarded as ?from= so the watch page can suggest siblings. */
  from?: string;
}

/**
 * Video card with a fixed 16:9 thumbnail area (no layout shift), lazy image
 * loading with graceful fallback, and a subtle hover/focus play overlay.
 */
export function VideoCard({ video, from }: VideoCardProps) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumb = Boolean(video.thumbnailUrl) && !thumbFailed;

  return (
    <Link href={watchPath(video.id, from)} className="group block rounded-lg focus-visible:outline-none">
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
      </div>
      <p className="mt-2.5 line-clamp-2 text-sm leading-snug text-foreground/90 transition-colors group-hover:text-foreground">
        {video.title ?? video.id}
      </p>
    </Link>
  );
}
