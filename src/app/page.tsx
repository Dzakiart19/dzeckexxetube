import type { Metadata } from "next";
import Link from "next/link";
import { Flag, Scale, ShieldCheck } from "lucide-react";
import { AgeGateCard } from "@/components/age-gate/AgeGateCard";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { SearchBar } from "@/components/search/SearchBar";
import { SectionHeader } from "@/components/section/SectionHeader";
import { FolderGrid } from "@/components/folders/FolderGrid";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { PUBLIC_MIN_AGE, PUBLIC_SITE_NAME } from "@/lib/public-config";
import { communityGuidelinesPath, copyrightPath, explorePath, reportPath, sourcesPath, thumbPath } from "@/lib/urls";
import { isAgeVerified } from "@/server/security/age-gate";
import { listActiveCategories, listApprovedFolders, listApprovedVideos } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description:
    `Platform penemuan video dewasa ${PUBLIC_MIN_AGE}+ dari sumber pihak ketiga yang legal dan terverifikasi. ` +
    `Jelajahi kategori dan folder yang telah dimoderasi. Hanya untuk usia ${PUBLIC_MIN_AGE} tahun ke atas.`,
  alternates: { canonical: "/" },
};

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Sumber terverifikasi" },
  { icon: ShieldCheck, label: "Moderasi otomatis aktif" },
  { icon: Flag, label: "Kanal pelaporan cepat" },
  { icon: Scale, label: "Copyright takedown resmi" },
];

export default async function HomePage() {
  const ageVerified = await isAgeVerified();
  const [categories, folderPage, videoPage] = await Promise.all([
    listActiveCategories(),
    listApprovedFolders(1),
    listApprovedVideos(1),
  ]);

  const featuredFolders = folderPage.items.slice(0, 8);
  const latestVideos = videoPage.items.slice(0, 12);

  return (
    <div className="space-y-14 pb-4">
      <PageViewTracker pathKind="home" />

      {/* Hero: headline + subheadline per product copy; age gate inline. */}
      <section className="hero-glow rounded-2xl border border-border/70 bg-card/40 px-5 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <p className="overline-label">Katalog video dewasa {PUBLIC_MIN_AGE}+</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
            Temukan video {PUBLIC_MIN_AGE}+ dari sumber terverifikasi.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Jelajahi koleksi video dewasa berdasarkan kategori dan folder. Hanya untuk pengguna berusia{" "}
            {PUBLIC_MIN_AGE} tahun ke atas.
          </p>

          <div className="mt-8">
            <SearchBar size="lg" />
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {TRUST_POINTS.map((point) => (
              <li key={point.label} className="flex items-center gap-1.5">
                <point.icon className="size-3.5 text-primary" aria-hidden />
                {point.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Age gate is rendered before any catalog content is revealed. */}
      {!ageVerified ? <AgeGateCard /> : null}

      {/* Neutral category navigation (labels are non-vulgar by policy). */}
      {categories.length > 0 ? (
        <section aria-labelledby="home-categories-heading">
          <div id="home-categories-heading">
            <SectionHeader
              overline="Dimoderasi"
              title="Kategori"
              description="Label kategori ditampilkan netral; konten sensitif selalu berada di balik age gate."
              action={{ href: explorePath(), label: "Semua folder" }}
            />
          </div>
          <nav aria-label="Kategori konten" className="flex flex-wrap gap-2">
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
        </section>
      ) : null}

      {featuredFolders.length > 0 ? (
        <section aria-labelledby="home-folders-heading">
          <div id="home-folders-heading">
            <SectionHeader
              overline="Termoderasi"
              title="Folder pilihan"
              description="Folder dengan koleksi aktif yang telah lolos pemeriksaan sumber."
              action={{ href: explorePath(), label: "Lihat semua" }}
            />
          </div>
          {ageVerified ? (
            <FolderGrid folders={featuredFolders} />
          ) : (
            <div
              className="rounded-xl border border-dashed border-border bg-card/30 px-6 py-10 text-center"
              aria-live="polite"
            >
              <p className="text-sm font-medium text-foreground">
                {folderPage.total} folder termoderasi tersedia
              </p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                Nama folder dan daftar videonya tampil setelah konfirmasi usia {PUBLIC_MIN_AGE}+ untuk menjaga
                tampilan tetap netral bagi pengunjung yang belum mengonfirmasi usia.
              </p>
            </div>
          )}
        </section>
      ) : (
        <EmptyState
          title="Katalog sedang disiapkan"
          description="Folder yang tersedia akan tampil di sini setelah proses sinkronisasi dan moderasi selesai."
          action={
            <Link href={sourcesPath()} className="text-sm text-primary underline-offset-2 hover:underline">
              Lihat sumber terverifikasi
            </Link>
          }
        />
      )}

      {latestVideos.length > 0 && ageVerified ? (
        <section aria-labelledby="home-videos-heading">
          <div id="home-videos-heading">
            <SectionHeader
              overline="Baru ditambahkan"
              title="Video terbaru"
              description="Entri terbaru yang disetujui. Judul dan thumbnail tampil setelah konfirmasi usia 18+."
            />
          </div>
          <VideoGrid
            locked={false}
            videos={latestVideos.map((video) => ({
              slug: video.slug,
              title: video.title,
              thumbSrc: thumbPath(video.thumbnailUrl),
              durationSeconds: video.durationSeconds,
              viewCount: video.viewCount,
            }))}
          />
        </section>
      ) : null}

      {/* Compliance strip: moderation + reporting entry points. */}
      <section className="rounded-xl border border-border/70 bg-card/40 p-6" aria-labelledby="home-compliance-heading">
        <div id="home-compliance-heading">
          <h2 className="text-base font-semibold tracking-tight">Kepatuhan dan keamanan</h2>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {PUBLIC_SITE_NAME} tidak menyimpan atau mendistribusikan file video pihak ketiga. Konten yang melanggar
          hukum atau kebijakan &mdash; termasuk materi anak di bawah umur, konten non-konsensual, konten bocor, dan
          pelanggaran hak cipta &mdash; dilarang keras dan dapat dilaporkan untuk penghapusan cepat.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={communityGuidelinesPath()} className="text-primary underline-offset-2 hover:underline">
            Pedoman Komunitas
          </Link>
          <span aria-hidden className="text-muted-foreground/40">
            ·
          </span>
          <Link href={reportPath()} className="text-primary underline-offset-2 hover:underline">
            Laporkan konten ilegal
          </Link>
          <span aria-hidden className="text-muted-foreground/40">
            ·
          </span>
          <Link href={copyrightPath()} className="text-primary underline-offset-2 hover:underline">
            Formulir DMCA
          </Link>
        </div>
      </section>
    </div>
  );
}
