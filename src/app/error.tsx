"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Global error boundary. Internal details (stack traces, digests) are never
 * shown; the user only gets a clear recovery action.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" aria-hidden />
      </span>
      <h1 className="text-xl font-medium">Terjadi kesalahan tak terduga</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Silakan coba memuat ulang halaman ini.
      </p>
      <Button variant="outline" onClick={reset} className="mt-2 min-h-11 gap-2 px-6">
        <RotateCcw className="size-4" aria-hidden />
        Coba lagi
      </Button>
    </div>
  );
}
