"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShieldAlert } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { PUBLIC_SITE_NAME } from "@/lib/public-config";
import { communityGuidelinesPath, explorePath, sourcesPath } from "@/lib/urls";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: explorePath(), label: "Jelajahi" },
  { href: sourcesPath(), label: "Sumber" },
  { href: communityGuidelinesPath(), label: "Pedoman" },
];

/**
 * Compact sticky header: logo mark, 18+ notice, primary navigation and a
 * search entry point (full input on desktop, icon on mobile).
 */
export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          aria-label={`${PUBLIC_SITE_NAME} - Beranda`}
        >
          <img src="/logo-mark.svg" alt="" width={36} height={36} className="size-9 shrink-0" />
          <span className="text-lg font-semibold tracking-tight">
            vide<span className="text-primary">y</span>tube
          </span>
        </Link>

        <span
          className="hidden shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary sm:flex"
          title="Konten dewasa 18+"
        >
          <ShieldAlert className="size-3" aria-hidden />
          18+
        </span>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="hidden w-56 md:block lg:w-72">
          <SearchBar size="compact" />
        </div>

        <Link
          href="/search"
          aria-label="Cari video"
          className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground md:hidden"
        >
          <Search className="size-5" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
