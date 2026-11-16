import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { AgeGateCard } from "@/components/age-gate/AgeGateCard";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { Pagination } from "@/components/navigation/Pagination";
import { SectionHeader } from "@/components/section/SectionHeader";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { PUBLIC_MIN_AGE, PUBLIC_SITE_NAME } from "@/lib/public-config";
import { folderPath, parsePageNumber, reportPath, siteUrl, thumbPath, VIDEOS_PER_PAGE } from "@/lib/urls";
import { isAgeVerified } from "@/server/security/age-gate";
import { getApprovedFolderBySlug, listApprovedVideos } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

interface FolderPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: FolderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const folder = await getApprovedFolderBySlug(slug).catch(() => null);

  if (!folder) {
    return { title: "Folder tidak ditemukan", robots: { index: false, follow: false } };
  }

  return {
    title: folder.name,
    description:
      folder.description ||
      `Koleksi video folder ${folder.name} dari sumber terverifikasi. Konten dewasa 18+ hanya tampil setelah konfirmasi usia.`,
    alternates: { canonical: folderPath(folder.slug) },
    openGraph: {
      title: folder.name,
      description: folder.description || `Koleksi video folder ${folder.name} termoderasi.`,
      url: folderPath(folder.slug),
    },
  };
}

export default async function FolderPage({ params, searchParams }: FolderPageProps) {
  const { slug } = await params;
  const { page: rawPage } = await searchParams;
  const page = parsePageNumber(rawPage);

  const folder = await getApprovedFolderBySlug(slug);
  // Unknown slug, rejected or unapproved folder: proper HTTP 404.
  if (!folder) notFound();

  const ageVerified = await isAgeVerified();
  const videos = await listApprovedVideos(page, folder.id);

  const breadcrumbItems = [
    { name: "Beranda", href: "/" },
    { name: "Jelajahi", href: "/explore" },
    ...(folder.category ? [{ name: folder.category.name, href: `/category/${folder.category.slug}` }] : []),
    { name: folder.name, href: folderPath(folder.slug) },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <PageViewTracker pathKind="folder" />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, siteUrl())} />
      <Breadcrumbs
        items={[
          { label: "Jelajahi", href: "/explore" },
          ...(folder.category ? [{ label: folder.category.name, href: `/category/${folder.category.slug}` }] : []),
          { label: folder.name },
        ]}
      />

      <header className="mb-6">
        <p className="overline-label">Folder termoderasi</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{folder.name}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {folder.description || `Kumpulan video dari folder ${folder.name} pada sumber terverifikasi.`}
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            {folder.videoCount} video telah diverifikasi
          </span>
          {folder.category ? (
            <Link href={`/category/${folder.category.slug}`} className="text-primary underline-offset-2 hover:underline">
              Kategori: {folder.category.name}
            </Link>
          ) : null}
        </p>
      </header>

      {/* Content warning: always present, thumbnails stay neutral until gate. */}
      <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          Halaman ini berisi konten dewasa {PUBLIC_MIN_AGE}+.{" "}
          {ageVerified
            ? "Thumbnail ditampilkan karena usia telah dikonfirmasi pada perangkat ini."
            : `Thumbnail dan pemutar hanya ditampilkan setelah konfirmasi usia. Preferensi tersimpan aman tanpa data pribadi.`}
        </span>
      </div>

      {!ageVerified ? <AgeGateCard /> : null}

      <section aria-labelledby="folder-videos-heading">
        <div id="folder-videos-heading">
          <SectionHeader
            overline="Terverifikasi"
            title="Daftar video"
            description={`Halaman ${page} dari ${videos.totalPages}. Entri belum diverifikasi tidak pernah ditampilkan.`}
          />
        </div>

        {videos.items.length > 0 ? (
          <>
            <VideoGrid
              locked={!ageVerified}
              videos={videos.items.map((video) => ({
                slug: video.slug,
                title: video.title,
                thumbSrc: thumbPath(video.thumbnailUrl),
                durationSeconds: video.durationSeconds,
                viewCount: video.viewCount,
              }))}
            />
            <Pagination
              page={page}
              totalPages={videos.totalPages}
              basePath={`/folder/${folder.slug}`}
              label={`Navigasi folder ${folder.name}`}
            />
          </>
        ) : (
          <EmptyState
            title="Folder tidak memiliki video aktif"
            description="Video pada folder ini sedang tidak tersedia atau belum lolos moderasi. Folder kosong tidak ditampilkan pada katalog publik."
            action={
              <Link href={reportPath()} className="text-sm text-primary underline-offset-2 hover:underline">
                Ada masalah? Laporkan
              </Link>
            }
          />
        )}
      </section>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground/80">
        {PUBLIC_SITE_NAME} tidak menyimpan file video pada folder ini; pemutaran disajikan langsung dari sumber pihak
        ketiga terverifikasi.
      </p>
    </div>
  );
}
