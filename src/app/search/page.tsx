import type { Metadata } from "next";
import { AgeGateCard } from "@/components/age-gate/AgeGateCard";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { SearchView } from "@/components/search/SearchView";
import { isAgeVerified } from "@/server/security/age-gate";
import { listActiveCategories } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pencarian",
  description: "Cari video di katalog termoderasi berdasarkan kata kunci, kategori, durasi, dan tanggal.",
  // Search result pages are thin/duplicated content: never indexed, never in sitemap.
  robots: { index: false, follow: true },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);
  const ageVerified = await isAgeVerified();
  const categories = await listActiveCategories();

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <PageViewTracker pathKind="search" />
      <Breadcrumbs items={[{ label: "Pencarian" }]} />

      <header className="mb-6">
        <p className="overline-label">Katalog termoderasi</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Pencarian</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Pencarian hanya mencakup video yang telah lolos pemeriksaan sumber dan moderasi otomatis.
        </p>
      </header>

      {ageVerified ? (
        <SearchView initialQuery={query} categories={categories.map((category) => ({ slug: category.slug, name: category.name }))} />
      ) : (
        <AgeGateCard />
      )}
    </div>
  );
}
