"use client";

import { SearchX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderGrid } from "@/components/folders/FolderGrid";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useRootFolder } from "@/hooks/use-streaming";
import { describeApiError } from "@/lib/error-messages";
import { searchPath } from "@/lib/urls";

/**
 * Local search over the root folder data already loaded through the internal
 * API. The upstream service does not expose a search endpoint, so this page
 * is honest about its limited scope and avoids mass crawling.
 */
export function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      router.replace(searchPath(query), { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, router]);

  const { data, isLoading, isError, error, isRefetching, refetch } = useRootFolder(1);

  const normalized = debouncedQuery.trim().toLowerCase();
  const hasQuery = normalized.length > 0;
  const folders = hasQuery && data ? data.folders.filter((folder) => folder.name.toLowerCase().includes(normalized)) : [];
  const videos = hasQuery && data ? data.videos.filter((video) => (video.title ?? "").toLowerCase().includes(normalized)) : [];
  const totalResults = folders.length + videos.length;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <p className="overline-label">Pencarian</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Cari video atau folder</h1>

      <form
        role="search"
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          router.replace(searchPath(query), { scroll: false });
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari judul video atau folder..."
          aria-label="Kata kunci pencarian"
          autoFocus
          className="h-12 w-full rounded-lg border border-input bg-card/60 px-4 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-input focus:border-primary/60 focus:outline-none"
        />
      </form>

      <p className="mt-3 rounded-lg border border-border bg-card/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Pencarian berjalan secara lokal pada data folder utama (halaman pertama) yang telah dimuat, sehingga hasil
        terbatas pada koleksi utama.
      </p>

      <div className="mt-8">
        {!hasQuery ? (
          <EmptyState
            icon={SearchX}
            title="Mulailah mengetik untuk mencari"
            description="Hasil pencarian akan muncul di sini saat Anda mengetik kata kunci."
          />
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4" aria-hidden>
            {Array.from({ length: 4 }).map((_item, index) => (
              <SkeletonCard key={index} variant="video" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={describeApiError(error, "Data pencarian tidak dapat dimuat.")} onRetry={() => refetch()} retrying={isRefetching} />
        ) : totalResults === 0 ? (
          <EmptyState
            icon={SearchX}
            title={`Tidak ada hasil untuk "${debouncedQuery.trim()}"`}
            description="Coba kata kunci lain, atau jelajahi folder utama untuk menemukan konten."
          />
        ) : (
          <div className="space-y-10">
            {folders.length > 0 && (
              <section aria-labelledby="search-folders-heading">
                <h2 id="search-folders-heading" className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Folder ({folders.length})
                </h2>
                <FolderGrid folders={folders} />
              </section>
            )}
            {videos.length > 0 && (
              <section aria-labelledby="search-videos-heading">
                <h2 id="search-videos-heading" className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Video ({videos.length})
                </h2>
                <VideoGrid videos={videos} />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
