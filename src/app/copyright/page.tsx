import type { Metadata } from "next";
import { LegalPageShell } from "@/components/layout/LegalPageShell";

export const metadata: Metadata = {
  title: "Hak Cipta & DMCA",
  description:
    "Pernyataan hak cipta videytube untuk situs video 18+ dan prosedur laporan penghapusan bergaya DMCA: unsur laporan, cara pengiriman, waktu respons, dan tindak lanjut.",
  alternates: { canonical: "/copyright" },
};

export default function CopyrightPage() {
  return (
    <LegalPageShell title="Hak Cipta & DMCA" updated="1 Januari 2026">
      <h2>1. Pernyataan Hak Cipta</h2>
      <p>
        <strong>
          videytube tidak menghosting dan tidak mengklaim kepemilikan atas konten apa
          pun.
        </strong>{" "}
        Seluruh konten yang dapat dilihat melalui videytube disajikan dari penyedia
        sumber konten pihak ketiga. videytube hanyalah antarmuka penjelajahan dan
        pemutaran: kami tidak menyimpan salinan konten, tidak mengunduh, dan tidak
        menyediakan fitur unduh.
      </p>

      <h2>2. Dasar Pengajuan Laporan</h2>
      <p>
        Jika Anda adalah pemilik hak cipta atau agen yang diberi wewenang untuk
        bertindak atas nama pemilik hak, dan Anda meyakini ada halaman di situs ini
        yang menyajikan tautan ke konten yang melanggar hak Anda, Anda dapat
        mengajukan laporan penghapusan (takedown) dengan mengikuti pola laporan
        DMCA di bawah ini.
      </p>

      <h2>3. Unsur Laporan</h2>
      <p>Agar dapat diproses, laporan Anda wajib memuat:</p>
      <ul>
        <li>
          <strong>Identitas dan kontak pelapor:</strong> nama lengkap, alamat,
          nomor telepon, dan alamat email yang dapat dihubungi.
        </li>
        <li>
          <strong>Identifikasi karya berhak cipta</strong> yang diklaim dilanggar,
          disertai deskripsi yang cukup rinci.
        </li>
        <li>
          <strong>URL halaman pada situs ini</strong> yang dilaporkan, misalnya{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
            {"/watch/{id}"}
          </code>
          , agar laporan dapat diidentifikasi dengan tepat.
        </li>
        <li>
          <strong>Pernyataan itikad baik</strong> bahwa penggunaan yang dikeluhkan
          tidak diizinkan oleh pemilik hak, agennya, atau hukum.
        </li>
        <li>
          <strong>Pernyataan keakuratan</strong> bahwa informasi dalam laporan
          akurat dan bahwa pelapor berwenang mengajukan laporan atas nama pemilik
          hak.
        </li>
        <li>
          <strong>Tanda tangan elektronik</strong> dari pemilik hak atau agen yang
          berwenang.
        </li>
      </ul>

      <h2>4. Cara Mengirim Laporan</h2>
      <p>
        Susun laporan sesuai daftar pada bagian di atas dan kirimkan melalui email
        ke <a href="mailto:legal@videytube.example">legal@videytube.example</a> dengan
        subjek{" "}
        <strong>&quot;Laporan Hak Cipta&quot;</strong>. Laporan yang tidak memuat
        unsur-unsur di atas mungkin tidak dapat kami proses.
      </p>
      <p className="rounded-md border border-border bg-muted/40 p-3 text-xs">
        Catatan untuk pemilik situs: alamat email di atas adalah placeholder. Ganti
        dengan alamat email resmi Anda dan sesuaikan prosedur laporan ini dengan
        yurisdiksi serta kerangka hukum yang berlaku di wilayah Anda sebelum
        menerbitkan halaman.
      </p>

      <h2>5. Waktu Respons dan Tindak Lanjut</h2>
      <p>
        Kami menargetkan respons awal atas laporan yang memenuhi syarat dalam
        waktu 2-5 hari kerja. Selama proses verifikasi berlangsung, kami dapat
        membatasi tautan yang dilaporkan agar tidak dapat diakses melalui videytube.
      </p>
      <p>
        Apabila laporan terbukti valid, tautan terkait akan dihapus dari situs ini.
        Laporan yang tidak lengkap akan kami mintakan kelengkapan, dan
        penyalahgunaan prosedur ini, misalnya klaim yang diketahui palsu, dapat
        membuat pelapor bertanggung jawab atas kerugian yang timbul.
      </p>
    </LegalPageShell>
  );
}
