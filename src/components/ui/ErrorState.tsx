"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  /** User-facing message in Indonesian; never includes internals or tokens. */
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** Error panel with an explicit retry action. Upstream failures never break the page. */
export function ErrorState({ title = "Terjadi kesalahan", message, onRetry, retrying = false, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-16 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-5 text-destructive" aria-hidden />
      </span>
      <p className="font-medium text-foreground">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 min-h-11 gap-2 border-destructive/40 px-5 hover:bg-destructive/10"
          onClick={onRetry}
          disabled={retrying}
        >
          <RotateCcw className={cn("size-4", retrying && "animate-spin")} aria-hidden />
          Coba lagi
        </Button>
      )}
    </div>
  );
}
