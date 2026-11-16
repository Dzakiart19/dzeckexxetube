import type { Metadata } from "next";
import { LegalPageShell } from "@/components/layout/LegalPageShell";
import { Button } from "@/components/ui/button";

const CONTACT_EMAIL = "legal@videytube.example";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Cara menghubungi videytube: saran dan masukan, laporan bug, pertanyaan privasi, serta laporan hak cipta melalui email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPageShell title="Kontak" updated="1 Januari 2026">
      <p>
        Kami senang mendengar dari Anda. Gunakan kanal di bawah untuk menyampaikan
        saran, melaporkan masalah, atau mengajukan pertanyaan seputar videytube.
      </p>

      <h2>Topik yang Dapat Dikirimkan</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <h3 className="text-sm">Saran &amp; masukan</h3>
          <p className="mt-1.5">
            Ide fitur, perbaikan tampilan, atau saran apa pun yang membuat videytube
            lebih nyaman digunakan.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <h3 className="text-sm">Laporan bug</h3>
          <p className="mt-1.5">
            Halaman gagal dimuat, pemutaran bermasalah, atau tautan yang tidak
            berfungsi. Sertakan halaman yang mengalami masalah agar mudah
            ditelusuri.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <h3 className="text-sm">Pertanyaan privasi</h3>
          <p className="mt-1.5">
            Pertanyaan seputar data yang diproses. Ringkasan praktik data kami ada
            pada halaman <a href="/privacy">Kebijakan Privasi</a>.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <h3 className="text-sm">Laporan hak cipta</h3>
          <p className="mt-1.5">
            Pemilik hak yang menemukan pelanggaran dapat membaca prosedur lengkap
            pada halaman <a href="/copyright">Hak Cipta &amp; DMCA</a>.
          </p>
        </div>
      </div>

      <h2>Kanal Kontak</h2>
      <p>
        Formulir kontak belum tersedia; untuk saat ini kanal yang aktif adalah
        email. Klik tombol di bawah untuk menyusun pesan langsung di aplikasi email
        Anda, atau kirim manual ke{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <div>
        <Button variant="outline" asChild>
          <a href={`mailto:${CONTACT_EMAIL}`}>Email {CONTACT_EMAIL}</a>
        </Button>
      </div>
      <p className="rounded-md border border-border bg-muted/40 p-3 text-xs">
        Catatan untuk pemilik situs: alamat email di atas adalah placeholder. Ganti
        dengan alamat email resmi Anda sebelum menerbitkan halaman ini.
      </p>

      <h2>Laporan Hak Cipta</h2>
      <p>
        Laporan hak cipta tidak cukup dikirim sebagai email biasa: laporan harus
        tetap mengikuti prosedur dan memuat unsur-unsur yang dijelaskan pada
        halaman <a href="/copyright">Hak Cipta &amp; DMCA</a> agar dapat diproses.
      </p>

      <h2>Waktu Respons</h2>
      <p>
        Estimasi waktu respons kami adalah 2-5 hari kerja. Untuk laporan hak
        cipta, target respons dan tindak lanjut dijelaskan lebih rinci pada
        halaman <a href="/copyright">Hak Cipta &amp; DMCA</a>.
      </p>
    </LegalPageShell>
  );
}
