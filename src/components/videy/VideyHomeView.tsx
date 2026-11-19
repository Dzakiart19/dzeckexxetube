"use client";

import { Film } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Pagination } from "@/components/navigation/Pagination";
import { VideySortTabs } from "@/components/videy/VideySortTabs";
import { VideyVideoGrid } from "@/components/videy/VideyVideoGrid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useVideyVideos } from "@/hooks/use-videy";
import { ApiError } from "@/lib/api-client";
import { describeApiError } from "@/lib/error-messages";
import { parsePageNumber, videyHomePath, VIDEY_SORTS, type VideySort } from "@/lib/urls";

/** Whitelist the raw ?sort= value against the known sort options. */
function parseSort(raw: string | null | undefined): VideySort {
  if (raw && (VIDEY_SORTS as readonly string[]).includes(raw)) return raw as VideySort;
  return "terbaru";
}

/**
 * Platform-2 ("videytube 2") listing: compact header with sort pills, the
 * flat video grid, and prev/next pagination driven by upstream evidence.
 * Retry bumps `refreshNonce` so the query re-keys with ?refresh=1.
 */
export function VideyHomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = parseSort(searchParams.get("sort"));
  const page = parsePageNumber(searchParams.get("page"));

  const [refreshNonce, setRefreshNonce] = useState(0);
  const { data, isLoading, isError, error, isRefetching } = useVideyVideos(page, sort, refreshNonce);

  const retry = () => setRefreshNonce((value) => value + 1);
  const videos = data?.videos ?? [];
  const hasItems = !isLoading && !isError && videos.length > 0;
  const totalPages = data?.totalPages ?? null;

  const navigate = (nextPage: number) => {
    router.push(videyHomePath(sort, nextPage), { scroll: true });
  };

  return (
    <section aria-labelledby="videy-listing-heading">
      <header className="border-b border-border/70 pb-6">
        <p className="overline-label">VIDEYTUBE 2</p>
        <h2 id="videy-listing-heading" className="mt-2 max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
          Video viral terbaru dari sumber kedua.
        </h2>
        <div className="mt-4">
          <VideySortTabs active={sort} />
        </div>
      </header>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-hidden>
            {Array.from({ length: 8 }).map((_item, index) => (
              <SkeletonCard key={index} variant="video" />
            ))}
          </div>
        ) : isError ? (
          error instanceof ApiError && error.code === "NOT_FOUND" ? (
            <EmptyState
              icon={Film}
              title="Daftar video tidak ditemukan"
              description="Daftar video belum tersedia untuk halaman ini."
            />
          ) : (
            <ErrorState
              message={describeApiError(error, "Daftar video sedang tidak dapat dimuat.")}
              onRetry={retry}
              retrying={isRefetching}
            />
          )
        ) : hasItems ? (
          <VideyVideoGrid videos={videos} sort={sort} />
        ) : (
          <EmptyState
            icon={Film}
            title="Belum ada video"
            description="Video belum tersedia untuk urutan ini. Coba muat ulang beberapa saat lagi."
            action={
              <Button variant="outline" size="sm" className="min-h-11 px-5" onClick={retry}>
                Muat ulang
              </Button>
            }
          />
        )}
      </div>

      {data && hasItems && (
        <Pagination page={page} hasNextPage={data.hasNextPage} onNavigate={navigate} isLoading={isLoading} />
      )}
      {data && hasItems && totalPages != null && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>
      )}
    </section>
  );
}
