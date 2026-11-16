import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { ContactForm } from "@/components/forms/ContactForm";
import { PUBLIC_SITE_NAME } from "@/lib/public-config";
import { contactPath } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    `Formulir kontak resmi ${PUBLIC_SITE_NAME} untuk pertanyaan umum, kepatuhan legal, dan kerja sama sumber konten.`,
  robots: { index: false, follow: true },
  alternates: { canonical: contactPath() },
  openGraph: {
    title: "Kontak",
    description: `Hubungi tim ${PUBLIC_SITE_NAME} untuk pertanyaan umum, kepatuhan legal, atau kerja sama sumber konten.`,
    url: contactPath(),
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Breadcrumbs items={[{ label: "Kontak" }]} />

      <header className="mb-8">
        <p className="overline-label">Bantuan</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Kontak</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Gunakan formulir di bawah untuk menyampaikan pertanyaan umum, kepatuhan legal, atau kerja sama sumber
          konten. Setiap pesan ditinjau oleh tim {PUBLIC_SITE_NAME} dan ditanggapi dalam 2-3 hari kerja.
        </p>
      </header>

      <section
        aria-labelledby="contact-channels-heading"
        className="mb-8 rounded-xl border border-border/70 bg-card/40 p-5"
      >
        <h2 id="contact-channels-heading" className="text-sm font-semibold text-foreground">
          Email resmi
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="font-mono text-foreground">legal@videytube.example</span> &mdash; urusan hukum,
            kepatuhan, dan permintaan penghapusan (DMCA).
          </li>
          <li>
            <span className="font-mono text-foreground">support@videytube.example</span> &mdash; pertanyaan umum dan
            bantuan penggunaan.
          </li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">
          Laporan konten ilegal sebaiknya dikirim melalui tombol Report pada halaman video agar ditangani dengan
          prioritas; pesan melalui formulir di bawah untuk urusan lainnya.
        </p>
      </section>

      <ContactForm />
    </div>
  );
}
