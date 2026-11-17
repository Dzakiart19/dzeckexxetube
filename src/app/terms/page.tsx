import type { Metadata } from "next";
import { LegalPageShell } from "@/components/layout/LegalPageShell";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description:
    "Ketentuan penggunaan videytube untuk situs video viral 18+: deskripsi layanan konten dewasa, aturan penggunaan yang wajar, ketersediaan tanpa jaminan, batasan tanggung jawab, serta hukum yang berlaku.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Ketentuan Layanan" updated="1 Januari 2026">
      <h2>1. Penerimaan Ketentuan</h2>
      <p>
        Dengan mengakses atau menggunakan <strong>videytube</strong> (selanjutnya disebut
        &quot;Layanan&quot;), Anda menyatakan telah membaca, memahami, dan menyetujui
        Ketentuan Layanan ini. Jika Anda tidak menyetujui sebagian atau seluruh
        ketentuan di halaman ini, mohon untuk tidak menggunakan Layanan.
      </p>

      <h2>2. Deskripsi Layanan</h2>
      <p>
        videytube adalah antarmuka penjelajahan dan pemutaran video. Layanan mengambil dan
        menampilkan metadata halaman serta aliran pemutaran yang seluruhnya bersumber
        dari penyedia sumber konten pihak ketiga.
      </p>
      <p>
        <strong>
          videytube tidak menghosting, tidak menyimpan, tidak mengunduh, dan tidak
          mengklaim kepemilikan
        </strong>{" "}
        atas konten apa pun yang ditampilkan. Seluruh hak atas konten tetap melekat
        pada pemilik haknya masing-masing. videytube juga tidak melewati login, paywall,
        atau perlindungan DRM milik penyedia konten, dan tidak menyediakan fitur
        unduh.
      </p>

      <h2>3. Penggunaan yang Wajar</h2>
      <p>
        Anda setuju untuk menggunakan Layanan secara wajar dan untuk tidak melakukan
        hal-hal berikut:
      </p>
      <ul>
        <li>
          menggunakan Layanan untuk aktivitas yang melanggar hukum yang berlaku di
          yurisdiksi Anda;
        </li>
        <li>
          mencoba mengakali batasan akses apa pun, termasuk membangkitkan kembali,
          menjual, atau mendistribusikan kembali akses pemutaran;
        </li>
        <li>
          mengunduh, merekam, atau mendistribusikan ulang konten tanpa izin dari
          pemilik haknya. videytube tidak menyediakan fitur unduh, dan upaya mengunduh
          melalui cara lain tetap merupakan pelanggaran ketentuan ini;
        </li>
        <li>
          membebani Layanan dengan permintaan otomatis yang berlebihan, seperti bot,
          scraping, atau skrip, sehingga mengganggu ketersediaan Layanan bagi
          pengguna lain.
        </li>
      </ul>

      <h2>4. Konten Pihak Ketiga</h2>
      <p>
        Ketersediaan dan kelangsungan pemutaran sepenuhnya bergantung pada penyedia
        sumber konten pihak ketiga. Jika sumber tersebut tidak tersedia, memindahkan
        alamat, atau membatasi akses, pemutaran dapat gagal atau halaman menjadi
        tidak dapat dimuat, dan kondisi tersebut berada di luar kendali videytube.
      </p>

      <h2>5. Ketersediaan Layanan dan Jaminan</h2>
      <p>
        Layanan disediakan{" "}
        <strong>&quot;sebagaimana adanya&quot;</strong> dan &quot;sebagaimana
        tersedia&quot;, tanpa jaminan dalam bentuk apa pun, baik tersurat maupun
        tersirat, termasuk jaminan ketersediaan tanpa gangguan, keakuratan, atau
        kesesuaian untuk tujuan tertentu.
      </p>

      <h2>6. Batasan Tanggung Jawab</h2>
      <p>
        Sejauh diizinkan oleh hukum yang berlaku, videytube tidak bertanggung jawab atas
        kerugian langsung, tidak langsung, insidental, khusus, atau konsekuensial
        yang timbul dari penggunaan atau ketidakmampuan menggunakan Layanan,
        termasuk namun tidak terbatas pada kegagalan pemutaran, ketidaktersediaan
        konten, atau tindakan penyedia sumber konten pihak ketiga.
      </p>

      <h2>7. Perubahan dan Penghentian Layanan</h2>
      <p>
        Kami berhak untuk memodifikasi Ketentuan Layanan ini, mengubah fitur
        Layanan, atau menghentikan seluruh atau sebagian Layanan kapan pun, dengan
        atau tanpa pemberitahuan sebelumnya. Penggunaan Layanan setelah perubahan
        diumumkan berarti Anda menyetujui ketentuan yang telah diperbarui.
      </p>

      <h2>8. Hukum yang Berlaku</h2>
      <p>
        Ketentuan Layanan ini tunduk pada dan ditafsirkan berdasarkan hukum negara
        tempat pemilik situs berdomisili. (Catatan untuk pemilik situs: sesuaikan
        kalimat ini dengan yurisdiksi spesifik Anda sebelum menerbitkan halaman.)
      </p>

      <h2>9. Kontak</h2>
      <p>
        Pertanyaan mengenai Ketentuan Layanan ini dapat dikirimkan ke{" "}
        <a href="mailto:legal@videytube.example">legal@videytube.example</a> atau melalui
        halaman <a href="/contact">Kontak</a>.
      </p>
      <p className="rounded-md border border-border bg-muted/40 p-3 text-xs">
        Catatan untuk pemilik situs: alamat email di atas adalah placeholder. Ganti
        dengan alamat email resmi Anda sebelum menerbitkan halaman ini.
      </p>
    </LegalPageShell>
  );
}
