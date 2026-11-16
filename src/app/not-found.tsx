import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-6 text-muted-foreground" aria-hidden />
      </span>
      <p className="text-5xl font-semibold tracking-tight text-primary">404</p>
      <h1 className="text-xl font-medium">Halaman tidak ditemukan</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Alamat yang Anda tuju tidak tersedia atau telah dipindahkan.
      </p>
      <Button asChild className="mt-2 min-h-11 px-6">
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
