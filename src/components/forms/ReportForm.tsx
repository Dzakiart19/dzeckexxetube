"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { copyrightPath } from "@/lib/urls";

const REPORT_CATEGORIES: { value: string; label: string }[] = [
  { value: "MINOR", label: "Melibatkan anak di bawah umur (prioritas tertinggi)" },
  { value: "NON_CONSENSUAL", label: "Konten non-konsensual atau kekerasan seksual" },
  { value: "REVENGE_PORN", label: "Distribusi konten intim tanpa persetujuan" },
  { value: "DEEPFAKE", label: "Deepfake seksual tanpa persetujuan" },
  { value: "HIDDEN_CAMERA", label: "Rekaman tersembunyi / voyeurisme" },
  { value: "LEAKED", label: "Konten bocor atau hasil peretasan" },
  { value: "COPYRIGHT", label: "Pelanggaran hak cipta" },
  { value: "OTHER", label: "Pelanggaran lainnya" },
];

interface ReportFormProps {
  /** Prefilled catalog path, e.g. /watch/some-slug. */
  initialUrl: string;
  /** Derived video slug when the prefilled URL points at a catalog page. */
  videoSlug: string | null;
}

interface SubmitResult {
  reference: string;
  message: string;
  hiddenPendingReview: boolean;
}

/**
 * Illegal-content report form. On success the reported entry is hidden
 * automatically pending review and a reference code is shown.
 */
export function ReportForm({ initialUrl, videoSlug }: ReportFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("URL atau jalur halaman konten wajib diisi.");
      return;
    }
    if (!category) {
      setError("Pilih jenis pelanggaran.");
      return;
    }
    if (details.trim().length < 10) {
      setError("Deskripsi minimal 10 karakter.");
      return;
    }
    if (!consent) {
      setError("Centang pernyataan kebenaran laporan.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUrl: url.trim().slice(0, 300),
          ...(videoSlug ? { videoSlug } : {}),
          category,
          details: details.trim(),
          reporterEmail: email.trim() || undefined,
          consent: true,
        }),
      });
      const body = (await response.json()) as
        | { success: true; data: SubmitResult }
        | { success: false; error: { message: string } };

      if (!response.ok || !body.success) {
        setError("success" in body && !body.success ? body.error.message : "Laporan gagal terkirim. Coba lagi.");
        return;
      }
      setResult(body.data);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-xl border border-primary/25 bg-card p-6 sm:p-8" role="status">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
          <CheckCircle2 className="size-6 text-primary" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold">Laporan diterima</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.message}</p>
        <p className="mt-4 text-sm">
          Kode referensi:{" "}
          <span className="rounded-md border border-border bg-secondary px-2 py-1 font-mono text-sm text-primary">
            {result.reference}
          </span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Simpan kode ini untuk menindaklanjuti status laporan. Laporan minor (konten anak di bawah umur) ditangani
          dengan prioritas tertinggi dan konten disembunyikan secara otomatis selama peninjauan.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm" className="min-h-11 px-5 bg-transparent">
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="report-url">URL atau jalur halaman konten</Label>
        <Input
          id="report-url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="/watch/slug-video atau URL lengkap"
          maxLength={300}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="report-category">Jenis pelanggaran</Label>
        <select
          id="report-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
          className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
        >
          <option value="" disabled>
            Pilih jenis pelanggaran...
          </option>
          {REPORT_CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="report-details">Deskripsi laporan</Label>
        <Textarea
          id="report-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Jelaskan pelanggaran yang Anda temukan (minimal 10 karakter)."
          rows={5}
          maxLength={4000}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="report-email">Email untuk tindak lanjut (opsional)</Label>
        <Input
          id="report-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nama@email.com"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground/80">
          Email hanya digunakan untuk komunikasi laporan ini dan tidak dibagikan ke pihak mana pun.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card/50 p-4">
        <Checkbox
          id="report-consent"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
          className="mt-0.5"
        />
        <Label htmlFor="report-consent" className="text-xs font-normal leading-relaxed text-muted-foreground">
          Saya menyatakan bahwa informasi dalam laporan ini benar dan saya melaporkan dengan itikad baik.
        </Label>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="min-h-11 gap-2 px-6">
        {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Flag className="size-4" aria-hidden />}
        Kirim laporan
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground/80">
        Pelanggaran hak cipta sebaiknya dikirim melalui{" "}
        <Link href={copyrightPath()} className="text-primary underline-offset-2 hover:underline">
          formulir Copyright &amp; DMCA
        </Link>{" "}
        agar mendapat proses takedown resmi.
      </p>
    </form>
  );
}
