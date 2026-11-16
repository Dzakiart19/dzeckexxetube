"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { VideoCard, type VideoCardView } from "@/components/videos/VideoCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
import { thumbPath } from "@/lib/urls";
import { cn } from "@/lib/utils";

interface SearchApiResult {
  items: {
    slug: string;
    title: string;
    thumbnailUrl: string | null;
    durationSeconds: number | null;
    viewCount: number;
  }[];
  total: number;
  page: number;
  totalPages: number;
}

interface SearchViewProps {
  initialQuery: string;
  categories: { slug: string; name: string }[];
}

interface Filters {
  category: string;
  duration: string;
  date: string;
  sort: string;
}

const DURATION_OPTIONS = [
  { value: "", label: "Semua durasi" },
  { value: "short", label: "< 5 menit" },
  { value: "medium", label: "5-15 menit" },
  { value: "long", label: "15-30 menit" },
  { value: "extra", label: "> 30 menit" },
];

const DATE_OPTIONS = [
  { value: "", label: "Semua tanggal" },
  { value: "day", label: "24 jam terakhir" },
  { value: "week", label: "7 hari terakhir" },
  { value: "month", label: "30 hari terakhir" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Terbaru" },
  { value: "popular", label: "Populer" },
];

const EMPTY_FILTERS: Filters = { category: "", duration: "", date: "", sort: "recent" };

/**
 * Interactive search over the moderated catalog: debounced query (300ms),
 * category/duration/date/sort filters and client pagination. Result states
 * (loading skeleton / error / empty / grid) are always explicit.
 */
export function SearchView({ initialQuery, categories }: SearchViewProps) {
  const router = useRouter();
  const [input, setInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  // Debounce the raw input into the committed query.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  // Keep the address bar shareable without a server navigation.
  useEffect(() => {
    const stable = debouncedQuery;
    router.replace(stable ? `/search?q=${encodeURIComponent(stable)}` : "/search", { scroll: false });
  }, [debouncedQuery, router]);

  const query = useQuery({
    queryKey: ["search", debouncedQuery, filters, page],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ q: debouncedQuery, page: String(page), sort: filters.sort });
      if (filters.category) params.set("category", filters.category);
      if (filters.duration) params.set("duration", filters.duration);
      if (filters.date) params.set("date", filters.date);
      return apiRequest<SearchApiResult>(`/api/search?${params.toString()}`, { signal });
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 30_000,
    retry: false,
    placeholderData: (previous) => previous,
  });

  const cards: VideoCardView[] = useMemo(
    () =>
      (query.data?.items ?? []).map((item) => ({
        slug: item.slug,
        title: item.title,
        thumbSrc: thumbPath(item.thumbnailUrl),
        durationSeconds: item.durationSeconds,
        viewCount: item.viewCount,
      })),
    [query.data],
  );

  const changeFilter = (patch: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const gotoPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loading = query.isFetching || (debouncedQuery.length > 0 && query.isPending);
  const failed = query.isError && debouncedQuery.length > 0;
  const hasFilters = filters.category || filters.duration || filters.date || filters.sort !== "recent";
  const result = query.data ?? null;

  return (
    <div>
      {/* Query input */}
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setDebouncedQuery(input.trim());
          setPage(1);
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          name="q"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Cari judul video di katalog termoderasi..."
          aria-label="Kata kunci pencarian"
          className="h-12 w-full rounded-lg border border-input bg-card/60 pl-10 pr-3 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-input focus:border-primary/60 focus:outline-none"
        />
      </form>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <label className="sr-only" htmlFor="filter-category">
          Filter kategori
        </label>
        <select
          id="filter-category"
          value={filters.category}
          onChange={(event) => changeFilter({ category: event.target.value })}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
        >
          <option value="">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-duration">
          Filter durasi
        </label>
        <select
          id="filter-duration"
          value={filters.duration}
          onChange={(event) => changeFilter({ duration: event.target.value })}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-date">
          Filter tanggal
        </label>
        <select
          id="filter-date"
          value={filters.date}
          onChange={(event) => changeFilter({ date: event.target.value })}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
        >
          {DATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-sort">
          Urutan hasil
        </label>
        <select
          id="filter-sort"
          value={filters.sort}
          onChange={(event) => changeFilter({ sort: event.target.value })}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-10 px-3 text-muted-foreground hover:text-foreground"
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            Reset filter
          </Button>
        ) : null}
      </div>

      {/* Result status line */}
      <p className="mt-6 text-xs text-muted-foreground" aria-live="polite">
        {loading
          ? "Mencari di katalog termoderasi..."
          : debouncedQuery && result
            ? `${result.total} hasil untuk "${debouncedQuery}" · halaman ${result.page} dari ${result.totalPages}`
            : ""}
      </p>

      {/* Results */}
      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_item, index) => (
              <SkeletonCard key={index} variant="video" />
            ))}
          </div>
        ) : failed ? (
          <EmptyState
            title="Pencarian gagal"
            description="Pencarian gagal. Silakan coba lagi."
            action={
              <Button variant="outline" size="sm" className="min-h-11 px-5 bg-transparent" onClick={() => gotoPage(1)}>
                Coba lagi
              </Button>
            }
          />
        ) : !debouncedQuery ? (
          <EmptyState
            title="Mulai mencari"
            description="Masukkan kata kunci untuk mencari judul video yang telah lolos moderasi. Hasil yang tidak relevan tidak ditampilkan."
          />
        ) : cards.length === 0 ? (
          <EmptyState
            title="Tidak ada hasil"
            description={
              hasFilters
                ? "Tidak ada video yang cocok dengan filter saat ini. Coba longgarkan filter atau ubah kata kunci."
                : "Tidak ada video yang cocok. Konten yang belum lolos moderasi tidak pernah ditampilkan."
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {cards.map((card) => (
                <VideoCard key={card.slug} video={card} locked={false} />
              ))}
            </div>
            {result && result.totalPages > 1 ? (
              <SearchPagination page={result.page} totalPages={result.totalPages} onGo={gotoPage} />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

interface SearchPaginationProps {
  page: number;
  totalPages: number;
  onGo: (page: number) => void;
}

function SearchPagination({ page, totalPages, onGo }: SearchPaginationProps) {
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let value = start; value <= Math.min(totalPages, start + 4); value += 1) pages.push(value);

  return (
    <nav aria-label="Navigasi hasil pencarian" className="mt-8 flex items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onGo(page - 1)}
        className={cn(
          "flex size-10 items-center justify-center rounded-md border border-border text-sm transition-colors",
          page <= 1 ? "text-muted-foreground/40" : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
        )}
        aria-label="Halaman sebelumnya"
      >
        ‹
      </button>
      {pages.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onGo(value)}
          aria-current={value === page ? "page" : undefined}
          aria-label={`Halaman ${value}`}
          className={cn(
            "flex size-10 items-center justify-center rounded-md border text-sm transition-colors",
            value === page
              ? "border-primary/50 bg-primary/15 font-semibold text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {value}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onGo(page + 1)}
        className={cn(
          "flex size-10 items-center justify-center rounded-md border border-border text-sm transition-colors",
          page >= totalPages ? "text-muted-foreground/40" : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
        )}
        aria-label="Halaman berikutnya"
      >
        ›
      </button>
    </nav>
  );
}
