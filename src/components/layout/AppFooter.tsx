import Link from "next/link";
import { PUBLIC_SITE_NAME } from "@/lib/public-config";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/search", label: "Cari" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "Ketentuan Layanan" },
  { href: "/privacy", label: "Kebijakan Privasi" },
  { href: "/copyright", label: "Hak Cipta & DMCA" },
  { href: "/contact", label: "Kontak" },
];

/**
 * Site footer. Sticks to the bottom of the viewport on short pages via the
 * shell's flex layout, respects bottom safe-area insets on mobile devices.
 */
export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-card/40">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src="/logo-mark.svg" alt="" width={32} height={32} className="size-8 shrink-0" />
              <p className="text-lg font-semibold tracking-tight">
                vide<span className="text-[#18B8AA]">y</span>tube
              </p>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              Platform penjelajahan dan pemutaran video viral indo 18+ yang ringan. {PUBLIC_SITE_NAME} tidak mengklaim
              kepemilikan atas konten yang ditampilkan; seluruh konten disediakan oleh penyedia pihak ketiga dan tetap
              menjadi hak pemilik masing-masing. Konten khusus untuk pengguna dewasa 18+.
            </p>
          </div>

          <nav aria-label="Navigasi footer">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Navigasi</p>
            <ul className="mt-3 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Tautan legal">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Legal</p>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {PUBLIC_SITE_NAME}. Situs video viral 18+ untuk pengguna dewasa.</p>
          <p>Konten dewasa 18+ disajikan dari penyedia pihak ketiga. {PUBLIC_SITE_NAME} bukan pemilik konten tersebut.</p>
        </div>
      </div>
    </footer>
  );
}
