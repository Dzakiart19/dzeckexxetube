import type { Metadata } from "next";
import { LegalPageShell } from "@/components/layout/LegalPageShell";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi videytube: data yang diproses, data yang tidak dikumpulkan, peran penyedia sumber konten pihak ketiga, serta hak Anda sebagai pengguna.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Kebijakan Privasi" updated="1 Januari 2026">
      <h2>1. Ringkasan</h2>
      <p>
        videytube dirancang agar dapat digunakan <strong>tanpa akun</strong>: tidak ada
        pendaftaran, tidak ada login, dan tidak ada cookie pelacak iklan. Kami tidak
        membangun profil tentang Anda dan tidak menjual data kepada siapa pun.
      </p>

      <h2>2. Data yang Kami Proses</h2>
      <p>Jumlah data yang kami proses dibuat sesedikit mungkin:</p>
      <ul>
        <li>
          <strong>Alamat IP.</strong> Diproses semata-mata untuk pembatasan laju
          permintaan (rate limiting) demi menjaga stabilitas Layanan. Alamat IP
          disimpan sementara di memori server, bukan di database, dan otomatis
          hilang saat server dimulai ulang.
        </li>
        <li>
          <strong>Log server yang di-redaksi.</strong> Log teknis disimpan dalam
          bentuk yang telah disunting; token sensitif dihapus secara otomatis
          sebelum log disimpan.
        </li>
        <li>
          <strong>Metadata halaman yang di-cache sementara.</strong> Untuk
          mengurangi beban permintaan, metadata halaman dapat disimpan sementara
          dengan masa berlaku singkat (TTL) di memori server, lalu terhapus
          otomatis setelah masa berlaku habis.
        </li>
      </ul>

      <h2>3. Data yang Tidak Kami Kumpulkan</h2>
      <p>Kami tidak mengumpulkan data berikut:</p>
      <ul>
        <li>Nama, alamat email, atau identitas pribadi lainnya.</li>
        <li>Riwayat tontonan yang dipersistenkan di server.</li>
        <li>
          Data pembayaran, karena Layanan tidak memproses transaksi apa pun.
        </li>
        <li>Cookie pelacak iklan atau data periklanan.</li>
      </ul>

      <h2>4. Penyedia Pihak Ketiga</h2>
      <p>
        Saat Anda membuka sebuah halaman, thumbnail dan video dimuat langsung dari
        CDN penyedia sumber konten pihak ketiga. Permintaan tersebut dikirim dari
        perangkat Anda, sehingga penyedia yang bersangkutan dapat mencatat alamat
        IP dan aktivitas permintaan Anda sesuai kebijakan privasi masing-masing.
        Kami menyarankan Anda membaca kebijakan privasi penyedia terkait untuk
        memahami praktik datanya.
      </p>

      <h2>5. Hak Anda dan Kontak</h2>
      <p>
        Karena tidak ada akun dan tidak ada data identitas yang dipersistenkan,
        tidak ada profil pengguna yang dapat kami akses, perbaiki, atau hapus atas
        permintaan. Jika Anda memiliki pertanyaan seputar data, sampaikan melalui
        halaman <a href="/contact">Kontak</a>.
      </p>
      <p>
        Jika Anda adalah pemilik hak cipta dan menemukan pelanggaran, ikuti
        prosedur laporan pada halaman{" "}
        <a href="/copyright">Hak Cipta &amp; DMCA</a>.
      </p>
    </LegalPageShell>
  );
}
