import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  /** Query params preserved on every page link (e.g. category filters). */
  query?: Record<string, string | undefined>;
  /** Accessible label announced by screen readers. */
  label?: string;
}

function buildHref(basePath: string, page: number, query?: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Compact window of page numbers around the current page. */
function pageWindow(page: number, totalPages: number): number[] {
  const span = 5;
  let start = Math.max(1, page - Math.floor(span / 2));
  const end = Math.min(totalPages, start + span - 1);
  start = Math.max(1, end - span + 1);
  const pages: number[] = [];
  for (let value = start; value <= end; value += 1) pages.push(value);
  return pages;
}

/**
 * Link-based pagination (works without JavaScript, no layout shift, and is
 * crawlable). Only rendered when there is more than one page.
 */
export function Pagination({ page, totalPages, basePath, query, label = "Navigasi halaman" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? buildHref(basePath, page - 1, query) : null;
  const next = page < totalPages ? buildHref(basePath, page + 1, query) : null;

  return (
    <nav aria-label={label} className="mt-8 flex items-center justify-center gap-1.5">
      {prev ? (
        <Link
          href={prev}
          rel="prev"
          aria-label="Halaman sebelumnya"
          className="flex size-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className="flex size-10 items-center justify-center rounded-md border border-border/50 text-muted-foreground/40" aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageWindow(page, totalPages).map((value) => (
        <Link
          key={value}
          href={buildHref(basePath, value, query)}
          aria-current={value === page ? "page" : undefined}
          aria-label={`Halaman ${value}`}
          className={cn(
            "flex size-10 items-center justify-center rounded-md border text-sm transition-colors",
            value === page
              ? "border-primary/50 bg-primary/15 font-semibold text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {value}
        </Link>
      ))}

      {next ? (
        <Link
          href={next}
          rel="next"
          aria-label="Halaman berikutnya"
          className="flex size-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className="flex size-10 items-center justify-center rounded-md border border-border/50 text-muted-foreground/40" aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
