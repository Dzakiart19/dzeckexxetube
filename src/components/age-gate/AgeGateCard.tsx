"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PUBLIC_MIN_AGE } from "@/lib/public-config";
import { adultContentPolicyPath, communityGuidelinesPath, termsPath } from "@/lib/urls";

interface AgeGateCardProps {
  variant?: "page" | "player";
}

/**
 * 18+ age gate. Confirming stores a non-identifying HttpOnly cookie via the
 * backend, then refreshes so server components render the gated content.
 * No age value, document or identifier is ever collected.
 */
export function AgeGateCard({ variant = "page" }: AgeGateCardProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/age-gate", { method: "POST" });
      if (!response.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setError("Konfirmasi gagal. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  const compact = variant === "player";

  return (
    <section
      aria-labelledby="age-gate-heading"
      className={
        compact
          ? "rounded-xl border border-primary/25 bg-card p-6"
          : "hero-glow rounded-xl border border-primary/25 bg-card p-6 sm:p-10"
      }
    >
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
          <ShieldAlert className="size-6 text-primary" aria-hidden />
        </span>
        <h2 id="age-gate-heading" className={compact ? "text-lg font-semibold" : "text-xl font-semibold sm:text-2xl"}>
          Konten dewasa {PUBLIC_MIN_AGE}+
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Halaman ini berisi materi dewasa dan hanya untuk pengguna berusia {PUBLIC_MIN_AGE} tahun ke atas. Dengan
          melanjutkan, Anda menyatakan telah berusia {PUBLIC_MIN_AGE} tahun atau lebih dan menyetujui{" "}
          <Link href={termsPath()} className="text-primary underline-offset-2 hover:underline">
            Ketentuan Layanan
          </Link>{" "}
          serta{" "}
          <Link href={adultContentPolicyPath()} className="text-primary underline-offset-2 hover:underline">
            Kebijakan Konten Dewasa
          </Link>
          .
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
          Preferensi Anda disimpan aman dalam cookie perangkat ini dan tidak berisi data pribadi.
        </p>

        <div className="mt-6 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={() => void confirm()}
            disabled={submitting}
            className="min-h-11 w-full gap-2 px-6 sm:w-auto"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Saya {PUBLIC_MIN_AGE} tahun atau lebih — Tampilkan
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full bg-transparent px-6 sm:w-auto">
            <Link href="/">Keluar</Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Lihat juga{" "}
          <Link href={communityGuidelinesPath()} className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
            Pedoman Komunitas
          </Link>
          .
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
