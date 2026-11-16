import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgeGateCard } from "@/components/age-gate/AgeGateCard";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { Pagination } from "@/components/navigation/Pagination";
import { FolderGrid } from "@/components/folders/FolderGrid";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { EmptyState } from "@/components/ui/EmptyState";
import { categoryPath, parsePageNumber, siteUrl } from "@/lib/urls";
import { db } from "@/lib/db";
import { isAgeVerified } from "@/server/security/age-gate";
import { APPROVED_FOLDER_WHERE, listApprovedFolders } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getCategory(slug: string) {
  return db.category.findFirst({
    where: {
      slug,
      folders: { some: APPROVED_FOLDER_WHERE },
    },
  });
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug).catch(() => null);

  if (!category) {
    return { title: "Kategori tidak ditemukan", robots: { index: false, follow: false } };
  }

  return {
    title: `Kategori ${category.name}`,
    description:
      `Koleksi folder kategori ${category.name} yang telah melewati pemeriksaan sumber dan moderasi. ` +
      `Konten dewasa 18+ hanya tampil setelah konfirmasi usia.`,
    alternates: { canonical: categoryPath(category.slug) },
    openGraph: {
      title: `Kategori ${category.name}`,
      description: `Koleksi folder ${category.name} termoderasi dari sumber terverifikasi.`,
      url: categoryPath(category.slug),
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: rawPage } = await searchParams;
  const page = parsePageNumber(rawPage);

  const category = await getCategory(slug);
  if (!category) notFound();

  const ageVerified = await isAgeVerified();
  const result = await listApprovedFolders(page, category.slug);

  const breadcrumbItems = [
    { name: "Beranda", href: "/" },
    { name: "Jelajahi", href: "/explore" },
    { name: category.name, href: categoryPath(category.slug) },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <PageViewTracker pathKind="category" />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, siteUrl())} />
      <Breadcrumbs items={[{ label: "Jelajahi", href: "/explore" }, { label: category.name }]} />

      <header className="mb-8">
        <p className="overline-label">Kategori</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{category.description}</p>
        ) : null}
      </header>

      {!ageVerified ? <AgeGateCard /> : null}

      <section aria-labelledby="category-folders-heading">
        <h2 id="category-folders-heading" className="sr-only">
          Folder dalam kategori {category.name}
        </h2>
        <p className="mb-4 text-xs text-muted-foreground" aria-live="polite">
          {result.total > 0
            ? `${result.total} folder · halaman ${page} dari ${result.totalPages}`
            : "Belum ada folder tersedia"}
        </p>

        {result.items.length > 0 ? (
          <>
            <FolderGrid folders={result.items} />
            <Pagination
              page={page}
              totalPages={result.totalPages}
              basePath={`/category/${category.slug}`}
              label={`Navigasi kategori ${category.name}`}
            />
          </>
        ) : (
          <EmptyState
            title="Belum ada folder pada kategori ini"
            description="Folder yang lolos moderasi untuk kategori ini akan tampil di sini ketika tersedia."
          />
        )}
      </section>
    </div>
  );
}
