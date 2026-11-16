import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { LegalPageShell } from "@/components/layout/LegalPageShell";
import { PUBLIC_MIN_AGE, PUBLIC_SITE_NAME } from "@/lib/public-config";
import {
  adultContentPolicyPath,
  communityGuidelinesPath,
  copyrightPath,
  reportPath,
  sourcesPath,
} from "@/lib/urls";

export const metadata: Metadata = {
  title: "Kebijakan Konten Dewasa",
  description:
    `Kebijakan konten dewasa ${PUBLIC_SITE_NAME}: ruang lingkup platform ${PUBLIC_MIN_AGE}+, verifikasi usia, konten yang dilarang keras, moderasi, penghapusan cepat, dan kanal pelaporan.`,
  alternates: { canonical: adultContentPolicyPath() },
  openGraph: {
    title: "Kebijakan Konten Dewasa",
    description:
      `Ruang lingkup platform ${PUBLIC_MIN_AGE}+, verifikasi usia, larangan konten, moderasi, dan kanal penghapusan cepat di ${PUBLIC_SITE_NAME}.`,
    url: adultContentPolicyPath(),
  },
};

export default function AdultContentPolicyPage() {
  return (
    /* The shell owns the page paddings; breadcrumbs render above it in the same column. */
    <div className="mx-auto w-full max-w-3xl px-1">
      <Breadcrumbs items={[{ label: "Kebijakan Konten Dewasa" }]} />
      <LegalPageShell title="Kebijakan Konten Dewasa" updated="16 November 2025">
        <h2>1. Ruang Lingkup</h2>
        <p>
          {PUBLIC_SITE_NAME} adalah platform penemuan dan katalog video dewasa yang bersumber dari penyedia pihak
          ketiga terverifikasi. Kami bukan pemilik maupun penyimpan file video: katalog hanya menampilkan metadata
          dan menautkan ke halaman penyedianya.
        </p>
        <p>Seluruh platform hanya ditujukan untuk pengguna berusia {PUBLIC_MIN_AGE} tahun ke atas.</p>

        <h2>2. Verifikasi Usia</h2>
        <p>
          Age gate wajib dijawab sebelum konten apa pun ditampilkan. Konfirmasi usia disimpan sebagai cookie
          fungsional di perangkat Anda tanpa data pribadi apa pun, sehingga preferensi tidak perlu diulang pada
          kunjungan berikutnya.
        </p>
        <p>
          Situs ini tidak ditujukan bagi anak di bawah umur. Jika Anda berusia di bawah {PUBLIC_MIN_AGE} tahun,
          hentikan penggunaan platform ini.
        </p>

        <h2>3. Konten yang Dilarang Keras</h2>
        <p>Kategori berikut dilarang tampil di katalog dan dihapus segera setelah terdeteksi atau dilaporkan:</p>
        <ul>
          <li>
            Konten yang melibatkan atau menggambarkan anak di bawah umur &mdash; larangan mutlak, dilaporkan ke
            penegak hukum, dan dihapus segera.
          </li>
          <li>Konten non-konsensual, termasuk kekerasan seksual, pemaksaan, dan kondisi tidak sadar.</li>
          <li>Revenge porn: distribusi konten intim tanpa persetujuan pihak yang tampil di dalamnya.</li>
          <li>Deepfake seksual tanpa persetujuan orang yang digambarkan.</li>
          <li>Rekaman tersembunyi atau voyeurisme tanpa persetujuan.</li>
          <li>Konten bocor atau hasil peretasan.</li>
          <li>Konten yang melanggar hak cipta.</li>
          <li>
            <strong>Kebijakan ini bukan pengganti izin atau lisensi:</strong> moderasi tidak memberikan legalitas
            pada konten yang memerlukan izin pemilik haknya.
          </li>
        </ul>

        <h2>4. Moderasi</h2>
        <p>
          Setiap entri katalog melewati pemeriksaan sumber dan moderasi otomatis berbasis blocklist sebelum dapat
          tampil. Konten yang belum terverifikasi tidak pernah ditampilkan. Log moderasi disimpan untuk keperluan
          audit dan tindak lanjut.
        </p>

        <h2>5. Penghapusan Cepat</h2>
        <p>
          Tombol Report tersedia di setiap halaman video. Konten yang dilaporkan disembunyikan secara otomatis
          selama peninjauan berlangsung. Pelanggaran hak cipta ditangani melalui{" "}
          <Link href={copyrightPath()}>formulir Copyright &amp; DMCA</Link>.
        </p>

        <h2>6. Sumber Konten</h2>
        <p>
          Pengindeksan terbatas hanya dilakukan pada sumber yang tercantum pada halaman{" "}
          <Link href={sourcesPath()}>Sumber Terverifikasi</Link>. Tidak ada pengindeksan massal URL di luar daftar
          tersebut.
        </p>

        <h2>7. Penegakan</h2>
        <p>Tindakan terhadap pelanggaran dijalankan berjenjang sesuai tingkat pelanggarannya:</p>
        <ul>
          <li>Penyembunyian otomatis selama peninjauan;</li>
          <li>Penghapusan permanen dari katalog;</li>
          <li>Penonaktifan sumber yang berulang melanggar;</li>
          <li>Pelaporan ke penegak hukum bila diwajibkan oleh peraturan yang berlaku.</li>
        </ul>

        <h2>8. Pelaporan</h2>
        <p>
          Gunakan <Link href={reportPath()}>formulir pelaporan konten</Link> untuk konten ilegal atau melanggar
          kebijakan, dan <Link href={copyrightPath()}>Copyright &amp; DMCA</Link> untuk klaim hak cipta. Aturan
          interaksi di sekitar layanan dijelaskan lebih lanjut pada{" "}
          <Link href={communityGuidelinesPath()}>Pedoman Komunitas</Link>.
        </p>
      </LegalPageShell>
    </div>
  );
}
