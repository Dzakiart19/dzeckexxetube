"use client";

import { FolderOpen } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { FolderGrid } from "@/components/folders/FolderGrid";
import { SearchBar } from "@/components/search/SearchBar";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useRootFolder } from "@/hooks/use-streaming";
import { describeApiError } from "@/lib/error-messages";
import { rootFolderPath } from "@/lib/urls";

/** Keep the homepage light: large root collections are revealed on /folder/{root}. */
const MAX_HOME_FOLDERS = 48;

/**
 * Homepage: compact hero with search, quick folder chips, then the root
 * folder listing ("Koleksi viral terbaru") and root videos when upstream provides
 * any. Content appears within the first viewport or two.
 */
export function HomeView() {
  const [refreshNonce, setRefreshNonce] = useState(0);
  const { data, isLoading, isError, error, isRefetching } = useRootFolder(1, refreshNonce);

  const folders = data?.folders ?? [];
  const videos = data?.videos ?? [];
  const chips = folders.slice(0, 8);
  const retry = () => setRefreshNonce((value) => value + 1);

  return (
    <div>
      <section className="border-b border-border/70 pb-10">
        <p className="overline-label">Video Viral 18+</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Nonton video viral indo 18+ terbaru.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Koleksi video viral dan video dewasa terbaru, diperbarui setiap hari. Putar langsung dari browser dengan streaming yang cepat, ringan, dan tanpa gangguan.
        </p>
        <div className="mt-6 max-w-xl">
          <SearchBar size="lg" />
        </div>
        {chips.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Folder populer">
            {chips.map((folder) => (
              <Link
                key={folder.id}
                href={`/folder/${encodeURIComponent(folder.id)}`}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                #{folder.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10" aria-labelledby="home-folders-heading">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="home-folders-heading" className="text-lg font-semibold tracking-tight">
            Koleksi viral terbaru
          </h2>
          {data && <span className="text-xs text-muted-foreground">{folders.length} folder</span>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }).map((_item, index) => (
              <SkeletonCard key={index} variant="folder" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={describeApiError(error, "Koleksi folder sedang tidak dapat dimuat.")} onRetry={retry} retrying={isRefetching} />
        ) : folders.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Belum ada folder"
            description="Folder belum tersedia. Coba muat ulang beberapa saat lagi."
            action={
              <Button variant="outline" size="sm" className="min-h-11 px-5" onClick={retry}>
                Muat ulang
              </Button>
            }
          />
        ) : (
          <>
            <FolderGrid folders={folders.slice(0, MAX_HOME_FOLDERS)} />
            {folders.length > MAX_HOME_FOLDERS && (
              <div className="mt-8 text-center">
                <Button asChild variant="outline" size="sm" className="min-h-11 px-6">
                  <Link href={rootFolderPath()}>Lihat semua {folders.length} folder</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {videos.length > 0 && (
        <section className="mt-12" aria-labelledby="home-videos-heading">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="home-videos-heading" className="text-lg font-semibold tracking-tight">
              Video viral terbaru
            </h2>
            <span className="text-xs text-muted-foreground">{videos.length} video</span>
          </div>
          <VideoGrid videos={videos} />
        </section>
      )}
    </div>
  );
}
