"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { homePath } from "@/lib/urls";

type ContactSubject = "general" | "legal" | "cooperation" | "other";

const SUBJECT_OPTIONS: { value: ContactSubject; label: string }[] = [
  { value: "general", label: "Pertanyaan umum" },
  { value: "legal", label: "Legal / kepatuhan" },
  { value: "cooperation", label: "Kerja sama sumber" },
  { value: "other", label: "Lainnya" },
];

interface ContactResult {
  received: boolean;
  message: string;
}

/** General contact form. Messages are stored for handling by the compliance team. */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<ContactSubject>("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContactResult | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Format email tidak valid.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Pesan minimal 10 karakter.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
        }),
      });
      const body = (await response.json()) as
        | { success: true; data: ContactResult }
        | { success: false; error: { message: string } };

      if (!response.ok || !body.success) {
        setError("success" in body && !body.success ? body.error.message : "Pesan gagal terkirim. Coba lagi.");
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
        <h2 className="text-lg font-semibold">Pesan terkirim</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm" className="min-h-11 px-5 bg-transparent">
            <Link href={homePath()}>Kembali ke beranda</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="contact-name">Nama</Label>
        <Input
          id="contact-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama Anda"
          maxLength={120}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nama@email.com"
          maxLength={200}
          required
        />
        <p className="text-xs text-muted-foreground/80">
          Email hanya digunakan untuk membalas pesan ini dan tidak dibagikan ke pihak mana pun.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subjek</Label>
        <select
          id="contact-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value as ContactSubject)}
          className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
        >
          {SUBJECT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Pesan</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tuliskan pertanyaan atau penjelasan Anda (minimal 10 karakter)."
          rows={5}
          maxLength={4000}
          required
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="min-h-11 gap-2 px-6">
        {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        Kirim pesan
      </Button>
    </form>
  );
}
