import type { Metadata } from "next";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { ReportForm } from "@/components/forms/ReportForm";
import { PUBLIC_SITE_NAME } from "@/lib/public-config";

export const metadata: Metadata = {
  title: "Laporkan Konten",
  description: "Formulir pelaporan konten ilegal di Videytube. Konten yang dilaporkan disembunyikan otomatis selama peninjauan.",
  robots: { index: false, follow: true },
};

interface ReportPageProps {
  searchParams: Promise<{ url?: string }>;
}

/** Extract a catalog video slug from a /watch/<slug> path if present. */
function extractWatchSlug(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/^\/watch\/([a-z0-9-]{1,80})\/?$/i);
  return match ? match[1].toLowerCase() : null;
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const { url } = await searchParams;
  const initialUrl = (url ?? "").slice(0, 300);
  const videoSlug = extractWatchSlug(initialUrl);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageViewTracker pathKind="report" />
      <Breadcrumbs items={[{ label: "Laporkan Konten" }]} />

      <header className="mb-8">
        <p className="overline-label">Kepatuhan</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Laporkan Konten</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Gunakan formulir ini untuk melaporkan konten ilegal atau melanggar kebijakan &mdash; termasuk konten yang
          melibatkan anak di bawah umur, konten non-konsensual, konten bocor, dan rekaman tersembunyi.{" "}
          {PUBLIC_SITE_NAME} memproses setiap laporan dan menyembunyikan konten yang dilaporkan secara otomatis
          selama peninjauan.
        </p>
      </header>

      <ReportForm initialUrl={initialUrl} videoSlug={videoSlug} />
    </div>
  );
}
