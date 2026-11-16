import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { LegalPageShell } from "@/components/layout/LegalPageShell";
import { PUBLIC_MIN_AGE, PUBLIC_SITE_NAME } from "@/lib/public-config";
import { communityGuidelinesPath, contactPath, copyrightPath, termsPath } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description:
    `Ketentuan layanan ${PUBLIC_SITE_NAME}: penerimaan, deskripsi layanan, persyaratan usia ${PUBLIC_MIN_AGE}+, penggunaan yang dilarang, konten pihak ketiga, dan batasan tanggung jawab.`,
  alternates: { canonical: termsPath() },
  openGraph: {
    title: "Ketentuan Layanan",
    description:
      `Penerimaan, persyaratan usia ${PUBLIC_MIN_AGE}+, penggunaan yang dilarang, konten pihak ketiga, dan batasan tanggung jawab di ${PUBLIC_SITE_NAME}.`,
    url: termsPath(),
  },
};

export default function TermsPage() {
  return (
    /* The shell owns the page paddings; breadcrumbs render above it in the same column. */
    <div className="mx-auto w-full max-w-3xl px-1">
      <Breadcrumbs items={[{ label: "Ketentuan Layanan" }]} />
      <LegalPageShell title="Ketentuan Layanan" updated="16 November 2025">
        <h2>1. Penerimaan</h2>
        <p>
          Dengan mengakses atau menggunakan {PUBLIC_SITE_NAME}, Anda menyatakan berusia {PUBLIC_MIN_AGE} tahun ke
          atas dan menerima Ketentuan Layanan ini. Jika Anda tidak menyetujui sebagian atau seluruh ketentuan, mohon
          untuk tidak menggunakan layanan.
        </p>

        <h2>2. Deskripsi Layanan</h2>
        <p>
          {PUBLIC_SITE_NAME} adalah katalog dan platform penemuan video dewasa yang seluruhnya bersumber dari
          penyedia pihak ketiga terverifikasi. Kami tidak menyimpan dan tidak mendistribusikan file video, serta
          tidak membuat klaim kepemilikan atas konten apa pun yang ditampilkan.
        </p>

        <h2>3. Persyaratan Usia</h2>
        <p>
          Layanan hanya untuk pengguna berusia {PUBLIC_MIN_AGE} tahun ke atas. Akses oleh anak di bawah umur
          merupakan pelanggaran terhadap ketentuan ini dan dapat dikenai pemblokiran akses.
        </p>

        <h2>4. Penggunaan yang Dilarang</h2>
        <p>
          Penggunaan yang dilarang &mdash; termasuk konten ilegal, scraping massal, probing API, dan upaya melewati
          moderasi &mdash; dijelaskan pada{" "}
          <Link href={communityGuidelinesPath()}>Pedoman Komunitas</Link> dan merupakan bagian dari ketentuan ini.
        </p>

        <h2>5. Konten Pihak Ketiga</h2>
        <p>
          Seluruh video dimiliki oleh penyedianya masing-masing dan disajikan{" "}
          <strong>&quot;apa adanya&quot;</strong>. Kami tidak menjamin ketersediaan, kelangsungan, atau keakuratan
          konten yang ditautkan dari sumber pihak ketiga.
        </p>

        <h2>6. Hak Cipta &amp; Takedown</h2>
        <p>
          Pemilik hak dapat mengajukan permintaan penghapusan mengikuti proses DMCA melalui{" "}
          <Link href={copyrightPath()}>Copyright &amp; DMCA</Link>. Permintaan yang sah dihapus dari katalog dan
          dicatat dalam log moderasi.
        </p>

        <h2>7. Batasan Tanggung Jawab</h2>
        <p>
          Layanan disediakan tanpa jaminan dalam bentuk apa pun, baik tersurat maupun tersirat. Sejauh diizinkan oleh
          hukum yang berlaku, {PUBLIC_SITE_NAME} tidak bertanggung jawab atas kerugian langsung maupun tidak langsung
          yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan; batas tanggung jawab yang berlaku
          adalah maksimal sejauh diizinkan oleh hukum.
        </p>

        <h2>8. Perubahan Ketentuan</h2>
        <p>
          Ketentuan ini dapat diperbarui sewaktu-waktu. Tanggal pembaruan terakhir tercantum di bagian atas halaman
          ini; penggunaan berkelanjutan setelah pembaruan berarti Anda menyetujui ketentuan yang berlaku.
        </p>

        <h2>9. Kontak</h2>
        <p>
          Pertanyaan mengenai Ketentuan Layanan ini dapat dikirim melalui{" "}
          <Link href={contactPath()}>halaman Kontak</Link>.
        </p>
      </LegalPageShell>
    </div>
  );
}
