"use client";

import { FileQuestion } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonPlayer } from "@/components/ui/SkeletonCard";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { usePlayback } from "@/hooks/use-streaming";
import { describeApiError } from "@/lib/error-messages";
import { thumbPath } from "@/lib/urls";
import type { ResolverStatus } from "@/lib/types";

const STATUS_BADGE: Record<ResolverStatus, { label: string; variant: "success" | "warning" | "destructive" | "muted" } | null> = {
  ready: { label: "Sumber tersedia", variant: "success" },
  fallback: { label: "Sumber tersedia", variant: "success" },
  expired: { label: "Sumber kedaluwarsa", variant: "warning" },
  forbidden: { label: "Dibatasi penyedia", variant: "warning" },
  "not-found": { label: "Tidak tersedia", variant: "destructive" },
  "upstream-error": { label: "Tidak tersedia", variant: "muted" },
};

const PLAYBACK_MESSAGES: Record<ResolverStatus, string> = {
  ready: "Video siap diputar.",
  fallback: "Video siap diputar.",
  expired: "Masa aktif pemutaran dari sumber sudah berakhir. Video mungkin tidak dapat diputar lagi.",
  forbidden: "Penyedia konten membatasi pemutaran video ini.",
  "not-found": "Video tidak ditemukan atau sudah dihapus dari sumber.",
  "upstream-error": "Sumber tidak dapat dijangkau saat ini. Silakan coba lagi nanti.",
};

interface WatchClientProps {
  /** Upstream identifier of the approved catalog entry. */
  upstreamId: string;
  /** Validated absolute thumbnail URL from the catalog (rendered via relay). */
  posterUrl: string | null;
  title: string;
  videoSlug: string;
}

/**
 * Player area with availability states. The metadata around the player is
 * server-rendered; this component only handles playback resolution.
 */
export function WatchClient({ upstreamId, posterUrl, title, videoSlug }: WatchClientProps) {
  const [refreshNonce, setRefreshNonce] = useState(0);
  const playbackQuery = usePlayback(upstreamId, refreshNonce);
  const playback = playbackQuery.data ?? null;

  const retry = () => setRefreshNonce((value) => value + 1);
  const badge = playback ? STATUS_BADGE[playback.status] : null;

  const renderPlayer = () => {
    if (playbackQuery.isLoading) {
      return (
        <div className="space-y-3">
          <SkeletonPlayer />
          <p className="text-center text-sm text-muted-foreground" aria-live="polite">
            Memeriksa ketersediaan sumber...
          </p>
        </div>
      );
    }

    if (playbackQuery.isError) {
      return (
        <ErrorState
          message={describeApiError(playbackQuery.error, "Pemutar video tidak dapat disiapkan.")}
          onRetry={retry}
          retrying={playbackQuery.isRefetching}
        />
      );
    }

    if (playback && playback.playbackUrl && (playback.status === "ready" || playback.status === "fallback")) {
      return (
        <VideoPlayer
          videoId={upstreamId}
          videoSlug={videoSlug}
          src={playback.playbackUrl}
          poster={thumbPath(posterUrl)}
          title={title}
          onRetry={retry}
        />
      );
    }

    if (playback && playback.status === "not-found") {
      return (
        <EmptyState
          icon={FileQuestion}
          title="Video tidak tersedia"
          description={PLAYBACK_MESSAGES[playback.status]}
          action={
            <Button variant="outline" size="sm" className="min-h-11 px-5 bg-transparent" onClick={retry}>
              Periksa ulang
            </Button>
          }
        />
      );
    }

    if (playback) {
      return (
        <ErrorState message={PLAYBACK_MESSAGES[playback.status]} onRetry={retry} retrying={playbackQuery.isRefetching} />
      );
    }

    return <SkeletonPlayer />;
  };

  return (
    <div className="space-y-3">
      {renderPlayer()}
      {badge ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
          Status ketersediaan sumber:
          <Badge variant={badge.variant === "success" ? "default" : badge.variant === "muted" ? "secondary" : "outline"} className="gap-1.5">
            <span
              aria-hidden
              className={`size-1.5 rounded-full ${
                badge.variant === "success" ? "bg-success" : badge.variant === "warning" ? "bg-amber-400" : "bg-destructive"
              }`}
            />
            {badge.label}
          </Badge>
        </p>
      ) : null}
    </div>
  );
}
