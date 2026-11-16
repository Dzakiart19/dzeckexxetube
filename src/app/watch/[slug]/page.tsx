import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarClock, Flag, Hourglass, Scale, ShieldCheck, Timer } from "lucide-react";
import { AgeGateCard } from "@/components/age-gate/AgeGateCard";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { SectionHeader } from "@/components/section/SectionHeader";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { WatchClient } from "@/components/videos/WatchClient";
import { Button } from "@/components/ui/button";
import { PUBLIC_SITE_NAME } from "@/lib/public-config";
import { formatDateIndo, formatDuration, formatViewCount } from "@/lib/format";
import {
  copyrightPath,
  folderPath,
  reportPath,
  sourcesPath,
  thumbPath,
  watchPath,
} from "@/lib/urls";
import { siteUrl } from "@/lib/urls";
import { isAgeVerified } from "@/server/security/age-gate";
import { getApprovedVideoBySlug, listRelatedVideos } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = await getApprovedVideoBySlug(slug).catch(() => null);

  if (!video) {
    return {
      title: "Video tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const canonical = watchPath(video.slug);
  const ogImage = thumbPath(video.thumbnailUrl);
  const description =
    `${video.title} — konten dewasa dari sumber terverifikasi ${video.source.name}. ` +
    `Ditayangkan melalui katalog termoderasi ${PUBLIC_SITE_NAME}. Hanya untuk usia 18+.`;

  return {
    title: video.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "video.other",
      title: video.title,
      description,
      url: canonical,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: video.title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;
  const video = await getApprovedVideoBySlug(slug).catch(() => null);

  // Removed / under-review / rejected / unknown entries: proper 404.
  if (!video) notFound();

  const ageVerified = await isAgeVerified();
  const related = await listRelatedVideos(video.id, video.folder?.id ?? null, 10);
  const duration = formatDuration(video.durationSeconds);
  const loadedAt = formatDateIndo(video.dataLoadedAt);
  const views = formatViewCount(video.viewCount);
  const poster = thumbPath(video.thumbnailUrl);

  const breadcrumbItems = [
    { name: "Beranda", href: "/" },
    { name: "Jelajahi", href: "/explore" },
    ...(video.folder ? [{ name: video.folder.name, href: folderPath(video.folder.slug) }] : []),
    { name: video.title, href: watchPath(video.slug) },
  ];

  const videoJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description || video.title,
    thumbnailUrl: video.thumbnailUrl ? `${siteUrl()}${thumbPath(video.thumbnailUrl)}` : undefined,
    uploadDate: video.dataLoadedAt.toISOString(),
    ...(duration
      ? { duration: `PT${Math.floor(video.durationSeconds! / 60)}M${video.durationSeconds! % 60}S` }
      : {}),
    contentUrl: `${siteUrl()}${watchPath(video.slug)}`,
    isFamilyFriendly: false,
    publisher: {
      "@type": "Organization",
      name: PUBLIC_SITE_NAME,
      url: siteUrl(),
    },
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageViewTracker pathKind="watch" videoSlug={video.slug} />
      <JsonLd data={videoJsonLd} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, siteUrl())} />

      <Breadcrumbs
        items={[
          { label: "Jelajahi", href: "/explore" },
          ...(video.folder ? [{ label: video.folder.name, href: folderPath(video.folder.slug) }] : []),
          { label: video.title },
        ]}
      />

      {ageVerified ? (
        <WatchClient upstreamId={video.upstreamId} posterUrl={video.thumbnailUrl} title={video.title} videoSlug={video.slug} />
      ) : (
        <AgeGateCard variant="player" />
      )}

      <section className="mt-6">
        <h1 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">{video.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden />
            Sumber:
            <Link href={sourcesPath()} className="text-foreground/90 underline-offset-2 hover:underline">
              {video.source.name}
            </Link>
            <BadgeCheck className="size-3.5 text-primary" aria-hidden />
            <span className="sr-only">terverifikasi</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5" aria-hidden />
            Data dimuat: {loadedAt ?? "tidak tersedia"}
          </span>
          <span className="flex items-center gap-1.5">
            <Timer className="size-3.5" aria-hidden />
            Durasi: {duration ?? "tidak tersedia"}
          </span>
          {views ? (
            <span className="flex items-center gap-1.5">
              <Hourglass className="size-3.5" aria-hidden />
              {views} tayangan
            </span>
          ) : null}
        </div>

        {video.description ? (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{video.description}</p>
        ) : null}

        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground/80">
          {PUBLIC_SITE_NAME} tidak menyimpan atau mendistribusikan file video ini. Pemutaran disajikan langsung dari
          sumber pihak ketiga yang telah diverifikasi dan mengizinkan penautan kontennya.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm" className="min-h-11 gap-2 bg-transparent px-4">
            <Link href={reportPath(watchPath(video.slug))}>
              <Flag className="size-4" aria-hidden />
              Laporkan konten
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-11 gap-2 bg-transparent px-4">
            <Link href={copyrightPath(watchPath(video.slug))}>
              <Scale className="size-4" aria-hidden />
              Copyright takedown
            </Link>
          </Button>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-12" aria-labelledby="related-heading">
          <div id="related-heading">
            <SectionHeader
              overline="Terverifikasi"
              title="Video terkait"
              description="Konten lain yang telah melewati pemeriksaan sumber dan moderasi."
            />
          </div>
          <VideoGrid
            compact
            locked={!ageVerified}
            videos={related.map((item) => ({
              slug: item.slug,
              title: item.title,
              thumbSrc: thumbPath(item.thumbnailUrl),
              durationSeconds: item.durationSeconds,
              viewCount: item.viewCount,
            }))}
          />
        </section>
      ) : null}
    </div>
  );
}
