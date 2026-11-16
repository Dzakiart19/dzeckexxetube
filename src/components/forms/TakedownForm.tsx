"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface TakedownResult {
  reference: string;
  message: string;
  removedImmediately: boolean;
}

interface TakedownFormProps {
  /** Prefilled catalog path, e.g. /watch/some-slug. */
  initialUrl: string;
  videoSlug: string | null;
}

/**
 * DMCA / copyright takedown form. Valid submissions remove the reported
 * catalog entry immediately and return a reference code.
 */
export function TakedownForm({ initialUrl, videoSlug }: TakedownFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [originalWork, setOriginalWork] = useState("");
  const [infringingUrl, setInfringingUrl] = useState(initialUrl);
  const [goodFaith, setGoodFaith] = useState(false);
  const [accuracy, setAccuracy] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TakedownResult | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) return setError("Nama pelapor wajib diisi.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Format email tidak valid.");
    if (infringingUrl.trim().length < 4) return setError("URL konten yang dilaporkan wajib diisi.");
    if (!goodFaith) return setError("Centang pernyataan itikad baik.");
    if (!accuracy) return setError("Centang pernyataan akurasi dan otorisasi.");
    if (signature.trim().length < 2) return setError("Tanda tangan (nama lengkap) wajib diisi.");

    setSubmitting(true);
    try {
      const response = await fetch("/api/copyright", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(videoSlug ? { videoSlug } : {}),
          complainantName: name.trim(),
          complainantEmail: email.trim(),
          originalWorkUrl: originalWork.trim() || undefined,
          infringingUrl: infringingUrl.trim(),
          goodFaith: true,
          accuracy: true,
          signature: signature.trim(),
        }),
      });
      const body = (await response.json()) as
        | { success: true; data: TakedownResult }
        | { success: false; error: { message: string } };

      if (!response.ok || !body.success) {
        setError("success" in body && !body.success ? body.error.message : "Permintaan gagal terkirim. Coba lagi.");
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
        <h2 className="text-lg font-semibold">Permintaan takedown diterima</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.message}</p>
        <p className="mt-4 text-sm">
          Kode referensi:{" "}
          <span className="rounded-md border border-border bg-secondary px-2 py-1 font-mono text-sm text-primary">
            {result.reference}
          </span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Entri katalog yang sah dihapus dan dicatat dalam log moderasi. Jika Anda adalah pihak yang dihapus dan
          ingin mengajukan penolakan (counter-notice), kirimkan melalui halaman kontak dengan kode referensi ini.
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
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="takedown-name">Nama pelapor / pemilik hak</Label>
          <Input
            id="takedown-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama lengkap atau badan hukum"
            maxLength={120}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="takedown-email">Email kontak</Label>
          <Input
            id="takedown-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
            maxLength={200}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="takedown-original">URL atau deskripsi karya asli (opsional)</Label>
        <Input
          id="takedown-original"
          value={originalWork}
          onChange={(event) => setOriginalWork(event.target.value)}
          placeholder="Tautan karya asli atau deskripsi kepemilikan"
          maxLength={300}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="takedown-infringing">URL konten yang dilaporkan</Label>
        <Textarea
          id="takedown-infringing"
          value={infringingUrl}
          onChange={(event) => setInfringingUrl(event.target.value)}
          placeholder="/watch/slug-video atau URL lengkap halaman konten"
          rows={3}
          maxLength={300}
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card/50 p-4">
          <Checkbox id="takedown-goodfaith" checked={goodFaith} onCheckedChange={(checked) => setGoodFaith(checked === true)} className="mt-0.5" />
          <Label htmlFor="takedown-goodfaith" className="text-xs font-normal leading-relaxed text-muted-foreground">
            Saya menyatakan dengan itikad baik bahwa penggunaan materi yang dilaporkan tidak diizinkan oleh pemilik
            hak, agennya, atau hukum.
          </Label>
        </div>
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card/50 p-4">
          <Checkbox id="takedown-accuracy" checked={accuracy} onCheckedChange={(checked) => setAccuracy(checked === true)} className="mt-0.5" />
          <Label htmlFor="takedown-accuracy" className="text-xs font-normal leading-relaxed text-muted-foreground">
            Saya menyatakan bahwa informasi dalam pemberitahuan ini akurat dan saya adalah pemilik hak atau
            diotorisasi untuk bertindak atas nama pemilik hak eksklusif.
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="takedown-signature">Tanda tangan (ketik nama lengkap)</Label>
        <Input
          id="takedown-signature"
          value={signature}
          onChange={(event) => setSignature(event.target.value)}
          placeholder="Nama lengkap"
          maxLength={120}
          required
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="min-h-11 gap-2 px-6">
        {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Scale className="size-4" aria-hidden />}
        Kirim permintaan takedown
      </Button>
    </form>
  );
}
