"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  /**
   * true   -> "next" is confirmed by upstream markup
   * false  -> upstream confirmed there is no next page
   * null   -> unconfirmed; the button renders disabled (no evidence)
   */
  hasNextPage: boolean | null;
  onNavigate: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Prev/next pagination. Buttons stay visible but disabled whenever there is
 * no evidence of an adjacent page, per the upstream uncertainty policy.
 */
export function Pagination({ page, hasNextPage, onNavigate, isLoading = false }: PaginationProps) {
  return (
    <nav aria-label="Navigasi halaman" className="mt-10 flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="sm"
        className="min-h-11 gap-1.5 px-4 disabled:opacity-40"
        disabled={page <= 1 || isLoading}
        onClick={() => onNavigate(page - 1)}
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Sebelumnya
      </Button>
      <span className="min-w-24 text-center text-sm text-muted-foreground" aria-live="polite">
        Halaman {page}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="min-h-11 gap-1.5 px-4 disabled:opacity-40"
        disabled={hasNextPage !== true || isLoading}
        onClick={() => onNavigate(page + 1)}
        aria-label="Halaman berikutnya"
      >
        Berikutnya
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </nav>
  );
}
