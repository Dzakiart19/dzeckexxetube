import Link from "next/link";
import { PUBLIC_SITE_NAME, PUBLIC_MIN_AGE } from "@/lib/public-config";
import {
  adultContentPolicyPath,
  communityGuidelinesPath,
  contactPath,
  copyrightPath,
  explorePath,
  privacyPath,
  reportPath,
  sourcesPath,
  termsPath,
} from "@/lib/urls";

const NAV_LINKS = [
  { href: explorePath(), label: "Jelajahi" },
  { href: sourcesPath(), label: "Sumber Terverifikasi" },
  { href: reportPath(), label: "Laporkan Konten" },
];

const LEGAL_LINKS = [
  { href: adultContentPolicyPath(), label: "Kebijakan Konten Dewasa" },
  { href: communityGuidelinesPath(), label: "Pedoman Komunitas" },
  { href: termsPath(), label: "Ketentuan Layanan" },
  { href: privacyPath(), label: "Kebijakan Privasi" },
  { href: copyrightPath(), label: "Copyright & DMCA" },
  { href: contactPath(), label: "Kontak" },
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
                vide<span className="text-primary">y</span>tube
              </p>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              Platform penemuan dan katalog video dewasa ({PUBLIC_MIN_AGE}+) dari sumber pihak ketiga yang legal dan
              terverifikasi. {PUBLIC_SITE_NAME} tidak menyimpan, mendistribusikan, atau mengklaim kepemilikan atas
              video yang ditampilkan; seluruh konten tetap menjadi hak penyedianya.
            </p>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              Hanya untuk pengguna berusia {PUBLIC_MIN_AGE} tahun ke atas. Konten yang melibatkan anak di bawah umur
              atau tidak konsensual dilarang keras dan segera dihapus.
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
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Kebijakan & Legal</p>
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
          <p>© {new Date().getFullYear()} {PUBLIC_SITE_NAME}. Katalog penemuan video independen.</p>
          <p>Video disajikan dari penyedia pihak ketiga terverifikasi. {PUBLIC_SITE_NAME} bukan pemilik konten tersebut.</p>
        </div>
      </div>
    </footer>
  );
}
