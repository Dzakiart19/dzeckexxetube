"use client";

import Link from "next/link";
import { videyHomePath, VIDEY_SORTS, type VideySort } from "@/lib/urls";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: Array<{ value: VideySort; label: string }> = VIDEY_SORTS.map((value) => ({
  value,
  label: value === "terbaru" ? "Terbaru" : value === "trending" ? "Trending" : "Lama",
}));

interface VideySortTabsProps {
  /** Currently active sort value; the matching pill gets aria-current. */
  active: VideySort;
}

/**
 * Sort pills for the platform-2 listing (Terbaru / Trending / Lama).
 * Pill look follows the home folder chips; active state uses the primary
 * tint shared with status badges.
 */
export function VideySortTabs({ active }: VideySortTabsProps) {
  return (
    <nav aria-label="Urutan video" className="flex flex-wrap gap-2">
      {SORT_OPTIONS.map((option) => {
        const isActive = option.value === active;
        return (
          <Link
            key={option.value}
            href={videyHomePath(option.value)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "border-transparent bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
