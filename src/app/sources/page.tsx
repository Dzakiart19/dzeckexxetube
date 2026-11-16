import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PUBLIC_MIN_AGE, PUBLIC_SITE_NAME } from "@/lib/public-config";
import { formatDateIndo } from "@/lib/format";
import { adultContentPolicyPath, copyrightPath, reportPath } from "@/lib/urls";
import { listVerifiedSources } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sumber Terverifikasi",
  description:
    "Daftar sumber pihak ketiga yang telah diverifikasi dan mengizinkan penautan kontennya di Videytube, beserta kriteria verifikasi dan kebijakan penautan.",
  alternates: { canonical: "/sources" },
  openGraph: {
    title: "Sumber Terverifikasi",
    description: "Sumber pihak ketiga terverifikasi yang mengizinkan penautan kontennya di Videytube.",
    url: "/sources",
  },
};

const INCLUSION_CRITERIA = [
  "Penyedia secara eksplisit mengizinkan penautan atau penyematan kontennya melalui ketentuan layanan atau izin langsung.",
  "Penyedia menerapkan kebijakan konten dewasa legal 18+ dengan larangan konten ilegal.",
  "Konten tersedia secara publik di halaman katalog penyedia.",
  "Ketersediaan layanan dan integritas metadata diperiksa sebelum sumber diaktifkan.",
];

export default async function SourcesPage() {
  const sources = await listVerifiedSources().catch(() => []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageViewTracker pathKind="sources" />
      <Breadcrumbs items={[{ label: "Sumber Terverifikasi" }]} />

      <header>
        <p className="overline-label">Transparansi</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Sumber Terverifikasi</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {PUBLIC_SITE_NAME} adalah platform penemuan dan katalog. Seluruh video disajikan dari penyedia pihak ketiga
          di bawah ini &mdash; kami tidak menyimpan, mendistribusikan, atau mengklaim kepemilikan atas file video
          tersebut. Otomatisasi pengindeksan terbatas pada sumber yang tercantum di halaman ini.
        </p>
      </header>

      <section className="mt-8" aria-labelledby="sources-criteria-heading">
        <h2 id="sources-criteria-heading" className="text-base font-semibold tracking-tight">
          Kriteria pemasukan sumber
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          {INCLUSION_CRITERIA.map((criterion) => (
            <li key={criterion} className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {criterion}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="sources-list-heading">
        <h2 id="sources-list-heading" className="text-base font-semibold tracking-tight">
          Sumber aktif
        </h2>

        {sources.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Belum ada sumber aktif"
              description="Sumber akan tampil di sini setelah proses verifikasi selesai."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {sources.map((source) => (
              <li
                key={source.slug}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-secondary">
                      <BadgeCheck className="size-5 text-primary" aria-hidden />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{source.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Terverifikasi {formatDateIndo(source.verifiedAt) ?? "-"} · {source._count.videos} video termoderasi
                      </p>
                    </div>
                  </div>
                  <a
                    href={source.homepageUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
                  >
                    Situs penyedia
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{source.description}</p>
                <p className="mt-2 text-xs text-muted-foreground/80">
                  Penautan diizinkan: {source.allowsEmbed ? "ya, melalui halaman katalog" : "tautan saja"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-xl border border-border/70 bg-card/40 p-6" aria-labelledby="sources-compliance-heading">
        <h2 id="sources-compliance-heading" className="text-base font-semibold tracking-tight">
          Kepatuhan konten
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Konten yang melanggar hukum &mdash; termasuk materi anak di bawah umur, konten non-konsensual, dan konten
          bocor &mdash; dilarang keras dan dihapus segera setelah terdeteksi atau dilaporkan. Lihat{" "}
          <Link href={adultContentPolicyPath()} className="text-primary underline-offset-2 hover:underline">
            Kebijakan Konten Dewasa
          </Link>{" "}
          untuk detailnya.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href={reportPath()} className="text-primary underline-offset-2 hover:underline">
            Laporkan konten ilegal
          </Link>
          <Link href={copyrightPath()} className="text-primary underline-offset-2 hover:underline">
            Copyright takedown (DMCA)
          </Link>
        </div>
      </section>
    </div>
  );
}
