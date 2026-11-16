import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ResolverStatus, VideoDetail } from "@/lib/types";

interface VideoMetadataProps {
  detail: VideoDetail;
  playbackStatus: ResolverStatus | null;
}

const STATUS_LABELS: Record<ResolverStatus, string> = {
  ready: "Siap diputar",
  fallback: "Siap diputar",
  expired: "Pemutaran sudah kedaluwarsa",
  forbidden: "Pemutaran dibatasi penyedia konten",
  "not-found": "Tidak ditemukan",
  "upstream-error": "Sumber bermasalah",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Title, status badge and neutral metadata for the watch page. */
export function VideoMetadata({ detail, playbackStatus }: VideoMetadataProps) {
  const fetchedLabel = formatDate(detail.fetchedAt);
  const expiresLabel = formatDate(detail.expiresAt);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {playbackStatus && (
          <Badge
            variant="outline"
            className={
              playbackStatus === "ready" || playbackStatus === "fallback"
                ? "border-transparent bg-primary/15 text-primary"
                : "border-transparent bg-muted text-muted-foreground"
            }
          >
            <BadgeCheck className="size-3.5" aria-hidden />
            {STATUS_LABELS[playbackStatus]}
          </Badge>
        )}
      </div>

      <h1 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{detail.title}</h1>

      <dl className="grid gap-x-8 gap-y-3 rounded-lg border border-border bg-card/50 p-4 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground/70">ID Video</dt>
          <dd className="font-mono text-xs text-foreground/90">{detail.id}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground/70">Durasi</dt>
          <dd className="text-foreground/90">{detail.duration ? `${detail.duration} detik` : "Tidak tersedia"}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground/70">Data dimuat</dt>
          <dd className="text-foreground/90">{fetchedLabel ?? "-"}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground/70">Akses berlaku hingga</dt>
          <dd className="text-foreground/90">{expiresLabel ?? "Mengikuti ketersediaan sumber"}</dd>
        </div>
      </dl>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Video disajikan dari penyedia pihak ketiga dan tidak disimpan oleh videytube. Ketersediaan pemutaran bergantung
        pada penyedia konten masing-masing.
      </p>
    </div>
  );
}
