"use client";

import { ArrowLeft, FileQuestion } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { VideoMetadata } from "@/components/videos/VideoMetadata";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard, SkeletonPlayer } from "@/components/ui/SkeletonCard";
import { useFolder, usePlayback, useVideoDetail } from "@/hooks/use-streaming";
import { ApiError } from "@/lib/api-client";
import { describeApiError } from "@/lib/error-messages";
import { PUBLIC_ROOT_FOLDER_ID } from "@/lib/public-config";
import type { ResolverStatus } from "@/lib/types";

const PLAYBACK_MESSAGES: Record<ResolverStatus, string> = {
  ready: "Video siap diputar.",
  fallback: "Video siap diputar.",
  expired: "Video tidak dapat diputar karena masa aktif pemutaran sudah berakhir.",
  forbidden: "Video tidak dapat diputar karena dibatasi oleh penyedia konten.",
  "not-found": "Video tidak ditemukan atau sudah dihapus.",
  "upstream-error": "Video sedang tidak tersedia. Silakan coba lagi nanti.",
};

/**
 * Watch view: player with resolution states, video metadata, and sibling
 * recommendations from the origin folder (or the root collection).
 */
export function WatchView({ videoId }: { videoId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFrom = searchParams.get("from") ?? "";
  const from = /^[A-Za-z0-9_-]{1,64}$/.test(rawFrom) ? rawFrom : null;

  const [refreshNonce, setRefreshNonce] = useState(0);
  const detailQuery = useVideoDetail(videoId, refreshNonce);
  const playbackQuery = usePlayback(videoId, refreshNonce);

  // Recommendations always come from a folder listing (origin folder when
  // known, otherwise the root collection).
  const recommendationFolderId = from ?? PUBLIC_ROOT_FOLDER_ID;
  const recommendationsQuery = useFolder(recommendationFolderId, 1);
  const siblings = (recommendationsQuery.data?.videos ?? []).filter((video) => video.id !== videoId).slice(0, 6);

  const retry = () => setRefreshNonce((value) => value + 1);
  const detail = detailQuery.data ?? null;
  const playback = playbackQuery.data ?? null;
  const detailNotFound = detailQuery.error instanceof ApiError && detailQuery.error.code === "NOT_FOUND";

  const renderPlayer = () => {
    if (detailQuery.isLoading) {
      return <SkeletonPlayer />;
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
        <ErrorState message={describeApiError(detailQuery.error, "Metadata video sedang tidak dapat dimuat.")} onRetry={retry} retrying={detailQuery.isRefetching} />
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
        <ErrorState message={describeApiError(playbackQuery.error, "Pemutar video tidak dapat disiapkan.")} onRetry={retry} retrying={playbackQuery.isRefetching} />
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

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: detail?.title ?? "Video" }]} />

      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 min-h-11 gap-2 px-3 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali
      </Button>

      {renderPlayer()}

      {detail && !detailQuery.isLoading && (
        <VideoMetadata detail={detail} playbackStatus={playback?.status ?? null} />
      )}

      <WatchRecommendations
        siblings={siblings}
        folderTitle={recommendationsQuery.data?.title ?? "koleksi utama"}
        folderId={recommendationFolderId}
        loading={recommendationsQuery.isLoading}
      />
    </div>
  );
}

function WatchRecommendations({
  siblings,
  folderTitle,
  folderId,
  loading,
}: {
  siblings: { id: string; title: string | null; url: string; thumbnailUrl?: string | null }[];
  folderTitle: string;
  folderId: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="mt-12" aria-hidden>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_item, index) => (
            <SkeletonCard key={index} variant="video" />
          ))}
        </div>
      </section>
    );
  }

  if (siblings.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="watch-siblings-heading">
      <h2 id="watch-siblings-heading" className="text-lg font-semibold tracking-tight">
        Video lainnya
      </h2>
      <p className="mt-1 mb-4 text-xs text-muted-foreground">Dari folder: {folderTitle}</p>
      <VideoGrid videos={siblings} from={folderId} />
    </section>
  );
}
