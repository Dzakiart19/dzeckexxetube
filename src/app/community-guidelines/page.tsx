import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { LegalPageShell } from "@/components/layout/LegalPageShell";
import { PUBLIC_SITE_NAME } from "@/lib/public-config";
import {
  adultContentPolicyPath,
  communityGuidelinesPath,
  contactPath,
  copyrightPath,
  reportPath,
  termsPath,
} from "@/lib/urls";

export const metadata: Metadata = {
  title: "Pedoman Komunitas",
  description:
    `Pedoman komunitas ${PUBLIC_SITE_NAME}: larangan keras konten ilegal, penyalahgunaan platform, proses peninjauan laporan, dan konsekuensi pelanggaran.`,
  alternates: { canonical: communityGuidelinesPath() },
  openGraph: {
    title: "Pedoman Komunitas",
    description:
      `Larangan konten, penyalahgunaan platform, proses peninjauan laporan, dan konsekuensi pelanggaran di ${PUBLIC_SITE_NAME}.`,
    url: communityGuidelinesPath(),
  },
};

export default function CommunityGuidelinesPage() {
  return (
    /* The shell owns the page paddings; breadcrumbs render above it in the same column. */
    <div className="mx-auto w-full max-w-3xl px-1">
      <Breadcrumbs items={[{ label: "Pedoman Komunitas" }]} />
      <LegalPageShell title="Pedoman Komunitas" updated="16 November 2025">
        <h2>1. Tujuan</h2>
        <p>
          Pedoman ini mengatur penggunaan platform {PUBLIC_SITE_NAME}: hal-hal yang diizinkan dan yang tidak boleh
          dilakukan di sekitar layanan, serta cara laporan ditinjau dan ditindaklanjuti. Pedoman ini melengkapi{" "}
          <Link href={adultContentPolicyPath()}>Kebijakan Konten Dewasa</Link> dan{" "}
          <Link href={termsPath()}>Ketentuan Layanan</Link>, dan berlaku untuk semua pengguna.
        </p>

        <h2>2. Larangan Keras</h2>
        <p>Hal-hal berikut dilarang tampil di katalog dan dihapus tanpa pemberitahuan sebelumnya:</p>
        <ul>
          <li>Konten anak di bawah umur (larangan mutlak).</li>
          <li>Konten non-konsensual.</li>
          <li>Revenge porn.</li>
          <li>Deepfake seksual tanpa persetujuan.</li>
          <li>Rekaman tersembunyi.</li>
          <li>Konten bocor atau hasil peretasan.</li>
          <li>Konten yang melanggar hak cipta.</li>
        </ul>

        <h2>3. Penyalahgunaan Platform</h2>
        <p>Selain larangan konten di atas, tindakan berikut juga dikenai konsekuensi:</p>
        <ul>
          <li>Mengirim laporan palsu atau menyalahgunakan kanal pelaporan;</li>
          <li>Mencoba melewati age gate untuk anak di bawah umur;</li>
          <li>Upaya ekstraksi atau unduhan massal data dan konten;</li>
          <li>Probing atau pengujian API tanpa izin.</li>
        </ul>

        <h2>4. Proses Peninjauan Laporan</h2>
        <p>
          Setiap laporan melewati status berurutan: diterima &rarr; ditinjau &rarr; tindakan atau ditolak. Log
          moderasi disimpan sebagai dasar keputusan, dan kode referensi diberikan kepada pelapor untuk menindaklanjuti
          status laporannya.
        </p>

        <h2>5. Konsekuensi Pelanggaran</h2>
        <p>
          Tindakan terhadap pelanggaran mencakup penyembunyian otomatis selama peninjauan, penghapusan permanen dari
          katalog, pemblokiran akses, dan pelaporan hukum bila diwajibkan oleh peraturan yang berlaku.
        </p>

        <h2>6. Cara Melaporkan</h2>
        <p>
          Tombol Report tersedia di setiap halaman video. Laporan juga dapat dikirim melalui{" "}
          <Link href={reportPath()}>formulir pelaporan konten</Link>, klaim hak cipta melalui{" "}
          <Link href={copyrightPath()}>Copyright &amp; DMCA</Link>, dan pertanyaan lain melalui{" "}
          <Link href={contactPath()}>halaman Kontak</Link>.
        </p>
      </LegalPageShell>
    </div>
  );
}
