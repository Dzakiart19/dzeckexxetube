"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { PUBLIC_ROOT_FOLDER_ID, PUBLIC_SITE_NAME } from "@/lib/public-config";
import { rootFolderPath } from "@/lib/urls";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: rootFolderPath(), label: "Jelajahi" },
  { href: "/search", label: "Cari" },
];

/**
 * Compact sticky header: text wordmark, primary navigation and a search
 * entry point (full input on desktop, icon on mobile).
 */
export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          aria-label={`${PUBLIC_SITE_NAME} - Beranda`}
        >
          <img src="/logo-mark.svg" alt="" width={36} height={36} className="size-9 shrink-0" />
          <span className="text-lg font-semibold tracking-tight">
            vide<span className="text-[#18B8AA]">y</span>tube
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("?")[0]);
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

        <div className="hidden w-56 md:block lg:w-80">
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
