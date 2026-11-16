"use client";

import Link from "next/link";
import { Eye, ShieldAlert } from "lucide-react";
import { ThumbImage } from "@/components/media/ThumbImage";
import { formatDuration, formatViewCount } from "@/lib/format";
import { watchPath } from "@/lib/urls";

export interface VideoCardView {
  slug: string;
  title: string;
  thumbSrc: string | null;
  durationSeconds?: number | null;
  viewCount?: number | null;
}

interface VideoCardProps {
  video: VideoCardView;
  /** When true no thumbnail is loaded at all: a neutral gate panel renders. */
  locked: boolean;
}

/**
 * Catalog video card. Before the 18+ gate is confirmed the card renders a
 * neutral placeholder instead of any image, so no explicit material is
 * visible or even requested.
 */
export function VideoCard({ video, locked }: VideoCardProps) {
  const duration = formatDuration(video.durationSeconds);
  const views = formatViewCount(video.viewCount);

  if (locked) {
    return (
      <Link href={watchPath(video.slug)} className="group block rounded-lg focus-visible:outline-none">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground/80" aria-hidden>
            <ShieldAlert className="size-6" />
            <span className="text-xs font-medium">Konten dewasa 18+</span>
          </div>
        </div>
        <p className="mt-2.5 line-clamp-2 text-sm leading-snug text-foreground/90">{video.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">Tampil setelah konfirmasi usia</p>
      </Link>
    );
  }

  return (
    <Link href={watchPath(video.slug)} className="group block rounded-lg focus-visible:outline-none">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted transition-colors duration-200 group-hover:border-primary/40">
        {video.thumbSrc ? (
          <ThumbImage src={video.thumbSrc} alt={`Thumbnail video ${video.title}`} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/60" aria-hidden>
            <ShieldAlert className="size-8 text-muted-foreground/60" />
          </div>
        )}
        {duration ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-foreground">
            {duration}
          </span>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
          <span className="flex size-11 items-center justify-center rounded-full border border-primary/60 bg-black/60 text-primary">
            <svg viewBox="0 0 24 24" className="size-5 translate-x-0.5 fill-current" aria-hidden>
              <path d="M8 5.5v13l11-6.5-11-6.5z" />
            </svg>
          </span>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-2 text-sm leading-snug text-foreground/90 transition-colors group-hover:text-foreground">
        {video.title}
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        {views ? (
          <>
            <Eye className="size-3" aria-hidden />
            {views} tayangan
          </>
        ) : (
          "Konten termoderasi"
        )}
      </p>
    </Link>
  );
}
