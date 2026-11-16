"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { homePath } from "@/lib/urls";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary. The error object is intentionally never rendered or
 * logged: its message may contain upstream details. Only the optional digest
 * (a safe correlation code) is surfaced, in muted text.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center py-24 text-center">
      <p className="overline-label">Kesalahan</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Terjadi kesalahan</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Sesuatu tidak berjalan semestinya saat memuat halaman ini. Tidak ada data yang hilang; Anda dapat mencoba
        lagi atau kembali ke beranda.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground/70">Kode: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} className="min-h-11 px-5">
          Coba lagi
        </Button>
        <Button asChild variant="outline" className="min-h-11 px-5 bg-transparent">
          <Link href={homePath()}>Kembali ke beranda</Link>
        </Button>
      </div>
    </div>
  );
}
