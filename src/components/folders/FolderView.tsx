"use client";

import { FolderOpen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { FolderGrid } from "@/components/folders/FolderGrid";
import { Pagination } from "@/components/navigation/Pagination";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useFolder } from "@/hooks/use-streaming";
import { ApiError } from "@/lib/api-client";
import { describeApiError } from "@/lib/error-messages";
import { parsePageNumber } from "@/lib/urls";

/** Folders are revealed in chunks to keep very large listings responsive. */
const FOLDER_CHUNK_SIZE = 60;

/**
 * Folder browse view: breadcrumb, title with item counts, subfolder grid,
 * video grid and prev/next pagination driven by upstream evidence.
 */
export function FolderView({ folderId }: { folderId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePageNumber(searchParams.get("page"));
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [visibleFolderCount, setVisibleFolderCount] = useState(FOLDER_CHUNK_SIZE);
  const { data, isLoading, isError, error, isRefetching } = useFolder(folderId, page, refreshNonce);

  const title = data?.title ?? "Folder";
  const folderCount = data?.folders.length ?? 0;
  const videoCount = data?.videos.length ?? 0;
  const visibleFolders = (data?.folders ?? []).slice(0, visibleFolderCount);
  const hasMoreFolders = folderCount > visibleFolderCount;
  const notFound = error instanceof ApiError && error.code === "NOT_FOUND";
  const retry = () => setRefreshNonce((value) => value + 1);

  const navigate = (nextPage: number) => {
    router.push(nextPage === 1 ? `/folder/${encodeURIComponent(folderId)}` : `/folder/${encodeURIComponent(folderId)}?page=${nextPage}`, {
      scroll: true,
    });
  };

  const hasItems = !isLoading && !isError && folderCount + videoCount > 0;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: title }]} />

      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isLoading ? "Memuat folder..." : `${folderCount} folder · ${videoCount} video`}
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-10" aria-hidden>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_item, index) => (
              <SkeletonCard key={`f-${index}`} variant="folder" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_item, index) => (
              <SkeletonCard key={`v-${index}`} variant="video" />
            ))}
          </div>
        </div>
      ) : isError ? (
        notFound ? (
          <EmptyState
            icon={FolderOpen}
            title="Folder tidak ditemukan"
            description="Folder tidak tersedia atau sudah dihapus."
          />
        ) : (
          <ErrorState
            message={describeApiError(error, "Folder sedang tidak dapat dimuat.")}
            onRetry={retry}
            retrying={isRefetching}
          />
        )
      ) : (
        hasItems && (
          <div className="space-y-10">
            {folderCount > 0 && (
              <section aria-labelledby="folder-subfolders-heading">
                <h2 id="folder-subfolders-heading" className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Folder
                </h2>
                <FolderGrid folders={visibleFolders} />
                {hasMoreFolders && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11 px-6"
                      onClick={() => setVisibleFolderCount((count) => count + FOLDER_CHUNK_SIZE)}
                    >
                      Tampilkan {Math.min(FOLDER_CHUNK_SIZE, folderCount - visibleFolderCount)} folder lagi
                      ({visibleFolderCount}/{folderCount})
                    </Button>
                  </div>
                )}
              </section>
            )}
            {videoCount > 0 && (
              <section aria-labelledby="folder-videos-heading">
                <h2 id="folder-videos-heading" className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Video
                </h2>
                <VideoGrid videos={data?.videos ?? []} from={folderId} />
              </section>
            )}
          </div>
        )
      )}

      {!isLoading && !isError && !hasItems && (
        <EmptyState
          icon={FolderOpen}
          title="Folder ini kosong"
          description="Belum ada folder atau video di dalam folder ini."
        />
      )}

      {data && hasItems && (
        <Pagination page={page} hasNextPage={data.hasNextPage} onNavigate={navigate} isLoading={isLoading} />
      )}
    </div>
  );
}
