"use client";

import { ArrowLeft, Clock, Eye, FileQuestion } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonPlayer } from "@/components/ui/SkeletonCard";
import { useVideyPlayback, useVideyVideoDetail } from "@/hooks/use-videy";
import { ApiError } from "@/lib/api-client";
import { describeApiError } from "@/lib/error-messages";
import type { ResolverStatus } from "@/lib/types";
import { videyHomePath, VIDEY_SORTS, type VideySort } from "@/lib/urls";

const PLAYBACK_MESSAGES: Record<ResolverStatus, string> = {
  ready: "Video siap diputar.",
  fallback: "Video siap diputar.",
  expired: "Video tidak dapat diputar karena masa aktif pemutaran sudah berakhir.",
  forbidden: "Video tidak dapat diputar karena dibatasi oleh penyedia konten.",
  "not-found": "Video tidak ditemukan atau sudah dihapus.",
  "upstream-error": "Video sedang tidak tersedia. Silakan coba lagi nanti.",
};

/** Whitelist the raw ?sort= value so "back to list" keeps the right order. */
function parseSort(raw: string | null | undefined): VideySort {
  if (raw && (VIDEY_SORTS as readonly string[]).includes(raw)) return raw as VideySort;
  return "terbaru";
}

/** "N tayangan" with Indonesian number formatting; null hides the row. */
function formatViewsLabel(views: number | null | undefined): string | null {
  if (views == null || !Number.isFinite(views) || views < 0) return null;
  return `${new Intl.NumberFormat("id-ID").format(views)} tayangan`;
}

/** Duration in m:ss (minutes unpadded, e.g. "3:45"); null hides the row. */
function formatDurationMeta(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/**
 * Platform-2 watch view: same resolution cascade as the main watch page
 * (detail -> playback -> player), with a platform badge, compact metadata
 * row, and a back link that preserves the active sort.
 */
export function VideyWatchView({ videoId }: { videoId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = parseSort(searchParams.get("sort"));

  const [refreshNonce, setRefreshNonce] = useState(0);
  const retry = () => setRefreshNonce((value) => value + 1);

  const detailQuery = useVideyVideoDetail(videoId, refreshNonce);
  const playbackQuery = useVideyPlayback(videoId, refreshNonce);

  const detail = detailQuery.data ?? null;
  const playback = playbackQuery.data ?? null;
  const detailNotFound = detailQuery.error instanceof ApiError && detailQuery.error.code === "NOT_FOUND";

  const renderPlayer = () => {
    if (detailQuery.isLoading) {
      return (
        <div className="space-y-3">
          <SkeletonPlayer />
          <p className="text-center text-sm text-muted-foreground" aria-live="polite">
            Menyiapkan halaman video...
          </p>
        </div>
      );
    }

    if (detailQuery.isError) {
      return detailNotFound ? (
        <EmptyState
          icon={FileQuestion}
          title="Video tidak ditemukan"
          description="Video tidak tersedia atau sudah dihapus."
          action={
            <Button variant="outline" size="sm" className="min-h-11 px-5" onClick={() => router.back()}>
              Kembali
            </Button>
          }
        />
      ) : (
        <ErrorState
          message={describeApiError(detailQuery.error, "Metadata video sedang tidak dapat dimuat.")}
          onRetry={retry}
          retrying={detailQuery.isRefetching}
        />
      );
    }

    if (playbackQuery.isLoading) {
      return (
        <div className="space-y-3">
          <SkeletonPlayer />
          <p className="text-center text-sm text-muted-foreground" aria-live="polite">
            Menyiapkan pemutar video...
          </p>
        </div>
      );
    }

    if (playbackQuery.isError) {
      const notFound = playbackQuery.error instanceof ApiError && playbackQuery.error.code === "NOT_FOUND";
      return notFound ? (
        <EmptyState icon={FileQuestion} title="Video tidak ditemukan" description="Video tidak tersedia atau sudah dihapus." />
      ) : (
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
          videoId={videoId}
          src={playback.playbackUrl}
          poster={detail?.thumbnailUrl ?? playback.posterUrl}
          title={detail?.title ?? videoId}
          onRetry={retry}
        />
      );
    }

    if (playback) {
      if (playback.status === "not-found") {
        return (
          <EmptyState
            icon={FileQuestion}
            title="Video tidak ditemukan"
            description={PLAYBACK_MESSAGES[playback.status]}
            action={
              <Button variant="outline" size="sm" className="min-h-11 px-5" onClick={retry}>
                Coba lagi
              </Button>
            }
          />
        );
      }
      return (
        <ErrorState message={PLAYBACK_MESSAGES[playback.status]} onRetry={retry} retrying={playbackQuery.isRefetching} />
      );
    }

    return <SkeletonPlayer />;
  };

  const viewsLabel = detail ? formatViewsLabel(detail.views) : null;
  const durationLabel = detail ? formatDurationMeta(detail.duration) : null;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "videytube 2", href: videyHomePath(sort) }, { label: detail?.title ?? "Video" }]}
      />

      {renderPlayer()}

      {detail && !detailQuery.isLoading && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-card text-muted-foreground">
              videytube 2
            </Badge>
          </div>

          <h1 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{detail.title}</h1>

          {(viewsLabel || durationLabel) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {viewsLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-4" aria-hidden />
                  {viewsLabel}
                </span>
              )}
              {durationLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden />
                  {durationLabel}
                </span>
              )}
            </div>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Sumber kedua: konten disajikan dari penyedia pihak ketiga.
          </p>

          <Link
            href={videyHomePath(sort)}
            className="-ml-3 inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Kembali ke daftar
          </Link>
        </div>
      )}
    </div>
  );
}
