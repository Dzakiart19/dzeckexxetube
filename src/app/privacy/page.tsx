import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { LegalPageShell } from "@/components/layout/LegalPageShell";
import { PUBLIC_SITE_NAME } from "@/lib/public-config";
import { contactPath, privacyPath } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    `Kebijakan privasi ${PUBLIC_SITE_NAME}: data yang dikumpulkan dan yang tidak dikumpulkan, cookie fungsional age gate, retensi data, serta hak Anda terkait data.`,
  alternates: { canonical: privacyPath() },
  openGraph: {
    title: "Kebijakan Privasi",
    description: `Minimisasi data, cookie fungsional age gate, retensi, dan hak Anda di ${PUBLIC_SITE_NAME}.`,
    url: privacyPath(),
  },
};

export default function PrivacyPage() {
  return (
    /* The shell owns the page paddings; breadcrumbs render above it in the same column. */
    <div className="mx-auto w-full max-w-3xl px-1">
      <Breadcrumbs items={[{ label: "Kebijakan Privasi" }]} />
      <LegalPageShell title="Kebijakan Privasi" updated="16 November 2025">
        <h2>1. Ringkasan</h2>
        <p>
          {PUBLIC_SITE_NAME} meminimalkan pemrosesan data. Tidak ada akun pengguna, tidak ada pendaftaran, dan tidak
          ada pelacakan pribadi: kami tidak membangun profil tentang Anda dan tidak menjual data kepada siapa pun.
        </p>

        <h2>2. Data yang Kami Kumpulkan</h2>
        <p>Jumlah data yang kami proses dibuat sesedikit mungkin:</p>
        <ul>
          <li>
            <strong>Konfirmasi usia.</strong> Disimpan sebagai cookie HttpOnly tanpa data pribadi; isinya hanyalah
            penanda age gate agar konfirmasi tidak perlu diulang di perangkat yang sama.
          </li>
          <li>
            <strong>Analitik anonim agregat.</strong> Jenis halaman, kata kunci pencarian, serta penghitung pemutaran
            dan kesalahan &mdash; tanpa IP yang tersimpan, tanpa identifier, dan tanpa URL penuh yang sensitif.
          </li>
          <li>
            <strong>Laporan &amp; takedown.</strong> Data yang Anda kirim pada formulir (nama, email, deskripsi)
            hanya digunakan untuk penanganan laporan terkait.
          </li>
          <li>
            <strong>Formulir kontak.</strong> Nama, email, subjek, dan pesan yang Anda kirim untuk ditanggapi tim
            kami.
          </li>
        </ul>

        <h2>3. Data yang Tidak Kami Kumpulkan</h2>
        <p>Kami tidak mengumpulkan data berikut:</p>
        <ul>
          <li>Riwayat perangkat lintas situs;</li>
          <li>Data biometrik;</li>
          <li>Lokasi presisi;</li>
          <li>Profil iklan.</li>
        </ul>

        <h2>4. Cookie</h2>
        <p>
          Hanya ada satu cookie fungsional di platform ini, yaitu penanda age gate. Tidak ada cookie iklan dan tidak
          ada cookie pelacakan pihak ketiga.
        </p>

        <h2>5. Penyimpanan &amp; Retensi</h2>
        <p>
          Log moderasi dan laporan disimpan sepanjang diperlukan untuk kepatuhan. Pesan kontak disimpan sampai
          ditangani. Analitik hanya disimpan dalam bentuk agregat tanpa atribut perorangan.
        </p>

        <h2>6. Hak Anda</h2>
        <p>
          Anda dapat meminta penghapusan data laporan melalui{" "}
          <Link href={contactPath()}>halaman Kontak</Link> dengan menyertakan kode referensi laporan. Tidak perlu
          akun untuk mengajukan permintaan, karena memang tidak ada akun yang kami kelola.
        </p>

        <h2>7. Kontak</h2>
        <p>
          Pertanyaan seputar praktik data di platform ini dapat dikirim melalui{" "}
          <Link href={contactPath()}>halaman Kontak</Link>.
        </p>
      </LegalPageShell>
    </div>
  );
}
