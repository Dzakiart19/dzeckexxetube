import type { Metadata } from "next";
import Link from "next/link";
import { AgeGateCard } from "@/components/age-gate/AgeGateCard";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { Pagination } from "@/components/navigation/Pagination";
import { FolderGrid } from "@/components/folders/FolderGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { explorePath, FOLDERS_PER_PAGE } from "@/lib/urls";
import { isAgeVerified } from "@/server/security/age-gate";
import { listActiveCategories, listApprovedFolders } from "@/server/catalog/queries";
import { parsePageNumber } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jelajahi Koleksi",
  description:
    "Telusuri seluruh folder video dewasa yang telah lolos pemeriksaan sumber dan moderasi. Konten sensitif hanya tampil setelah konfirmasi usia 18+.",
  alternates: { canonical: "/explore" },
  openGraph: {
    title: "Jelajahi Koleksi",
    description: "Telusuri folder video dewasa termoderasi dari sumber terverifikasi.",
    url: "/explore",
  },
};

interface ExplorePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { page: rawPage } = await searchParams;
  const page = parsePageNumber(rawPage);
  const ageVerified = await isAgeVerified();

  const [categories, result] = await Promise.all([listActiveCategories(), listApprovedFolders(page)]);

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <PageViewTracker pathKind="explore" />
      <Breadcrumbs items={[{ label: "Jelajahi" }]} />

      <header className="mb-8">
        <p className="overline-label">Katalog termoderasi</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Jelajahi Koleksi</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Semua folder di bawah ini telah melewati pemeriksaan sumber dan moderasi otomatis. Konten dewasa hanya
          tampil setelah konfirmasi usia 18+.
        </p>
      </header>

      {!ageVerified ? <AgeGateCard /> : null}

      {categories.length > 0 ? (
        <nav aria-label="Filter kategori" className="mb-8 flex flex-wrap gap-2">
          <span className="sr-only">Filter berdasarkan kategori:</span>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {category.name}
              <span className="ml-2 text-xs text-muted-foreground/70">{category.folderCount}</span>
            </Link>
          ))}
        </nav>
      ) : null}

      <section aria-labelledby="explore-folders-heading">
        <h2 id="explore-folders-heading" className="sr-only">
          Daftar folder
        </h2>
        <p className="mb-4 text-xs text-muted-foreground" aria-live="polite">
          {result.total > 0
            ? `${result.total} folder · halaman ${page} dari ${result.totalPages}`
            : "Belum ada folder tersedia"}
        </p>

        {result.items.length > 0 ? (
          <>
            <FolderGrid folders={result.items} />
            <Pagination page={page} totalPages={result.totalPages} basePath="/explore" label="Navigasi folder" />
          </>
        ) : (
          <EmptyState
            title="Folder tidak tersedia"
            description="Belum ada folder yang lolos moderasi saat ini. Folder kosong atau tertunda tidak ditampilkan."
          />
        )}
      </section>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground/80">
        Setiap folder berisi deskripsi aman dan jumlah video yang telah diverifikasi. Halaman folder menampilkan
        breadcrumb, pagination, dan peringatan konten dewasa. Maksimal {FOLDERS_PER_PAGE} folder per halaman.
      </p>
    </div>
  );
}
