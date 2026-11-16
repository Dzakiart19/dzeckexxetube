import type { Metadata } from "next";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { TakedownForm } from "@/components/forms/TakedownForm";
import { PUBLIC_SITE_NAME } from "@/lib/public-config";

export const metadata: Metadata = {
  title: "Copyright & Takedown (DMCA)",
  description:
    "Kebijakan hak cipta Videytube dan formulir permintaan penghapusan (takedown) bergaya DMCA untuk pemilik hak atau agen resmi.",
  robots: { index: false, follow: true },
};

interface CopyrightPageProps {
  searchParams: Promise<{ url?: string }>;
}

function extractWatchSlug(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/^\/watch\/([a-z0-9-]{1,80})\/?$/i);
  return match ? match[1].toLowerCase() : null;
}

export default async function CopyrightPage({ searchParams }: CopyrightPageProps) {
  const { url } = await searchParams;
  const initialUrl = (url ?? "").slice(0, 300);
  const videoSlug = extractWatchSlug(initialUrl);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageViewTracker pathKind="copyright" />
      <Breadcrumbs items={[{ label: "Copyright & Takedown" }]} />

      <header className="mb-8">
        <p className="overline-label">Kepatuhan hak cipta</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Copyright &amp; Takedown (DMCA)</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {PUBLIC_SITE_NAME} tidak menghosting dan tidak mengklaim kepemilikan atas konten apa pun. Seluruh video
          disajikan dari penyedia pihak ketiga terverifikasi. Jika Anda pemilik hak atau agen resmi dan menemukan
          entri katalog yang melanggar, ajukan permintaan penghapusan melalui formulir di bawah.
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-border/70 bg-card/40 p-5" aria-labelledby="dmca-process-heading">
        <h2 id="dmca-process-heading" className="text-sm font-semibold text-foreground">
          Proses penanganan
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Permintaan yang sah dihapus dari katalog secara langsung dan dicatat dalam log moderasi.</li>
          <li>Kode referensi diberikan untuk tindak lanjut status permintaan.</li>
          <li>Penyedia sumber diberitahu agar sumber aslinya juga ditinjau ulang.</li>
          <li>Pihak yang dihapus dapat mengajukan counter-notice melalui halaman kontak.</li>
        </ol>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">
          Penyalahgunaan proses takedown (klaim palsu) dapat menempatkan penyalahguna di bawah tanggung jawab
          hukum sesuai prinsip pernyataan di bawah.
        </p>
      </section>

      <TakedownForm initialUrl={initialUrl} videoSlug={videoSlug} />
    </div>
  );
}
