import Link from "next/link";
import { Button } from "@/components/ui/button";
import { explorePath, homePath, reportPath, sourcesPath } from "@/lib/urls";

/**
 * Custom 404 page. Renders inside the AppShell, so it stays a simple centered
 * section without page-level metadata.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center py-24 text-center">
      <p className="overline-label">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Halaman tidak ditemukan</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Halaman yang Anda tuju tidak tersedia. Entri dapat dihapus melalui proses moderasi atau takedown hak cipta,
        atau alamat tersebut tidak pernah ada.
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Jika Anda tiba di halaman ini dari tautan di bagian lain situs, Anda dapat{" "}
        <Link href={reportPath()} className="text-primary underline-offset-2 hover:underline">
          melaporkan tautan tersebut
        </Link>{" "}
        agar dapat ditinjau.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline" className="min-h-11 px-5 bg-transparent">
          <Link href={homePath()}>Beranda</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11 px-5 bg-transparent">
          <Link href={explorePath()}>Jelajahi</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11 px-5 bg-transparent">
          <Link href={sourcesPath()}>Sumber</Link>
        </Button>
      </div>
    </div>
  );
}
