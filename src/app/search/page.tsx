import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/search/SearchView";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

export const metadata: Metadata = {
  title: "Pencarian",
  description: "Cari video atau folder pada koleksi utama.",
  robots: { index: false, follow: false },
};

function SearchPageFallback() {
  return (
    <div className="mx-auto w-full max-w-4xl" aria-hidden>
      <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      <div className="mt-3 h-8 w-72 rounded bg-muted animate-pulse" />
      <div className="mt-6 h-12 w-full rounded-lg bg-muted animate-pulse" />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl">
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4" aria-hidden>
            {Array.from({ length: 4 }).map((_item, index) => (
              <SkeletonCard key={index} variant="video" />
            ))}
          </div>
        </div>
      }
    >
      <SearchView />
    </Suspense>
  );
}
