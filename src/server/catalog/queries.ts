import { db } from "@/lib/db";
import { FOLDERS_PER_PAGE, VIDEOS_PER_PAGE } from "@/lib/urls";

/**
 * Read-side catalog queries. Every query filters on moderation status and a
 * verified, active source, so unapproved content can never leak into pages,
 * APIs, the sitemap, or structured data.
 */

export const APPROVED_VIDEO_WHERE = {
  status: "APPROVED",
  source: { verified: true, status: "ACTIVE" },
} as const;

export const APPROVED_FOLDER_WHERE = {
  status: "APPROVED",
  source: { verified: true, status: "ACTIVE" },
} as const;

export interface FolderListItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  videoCount: number;
  category: { slug: string; name: string } | null;
}

export interface VideoListItem {
  id: number;
  slug: string;
  title: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  viewCount: number;
  dataLoadedAt: Date;
  folder: { slug: string; name: string } | null;
}

function folderSelect() {
  return {
    id: true,
    slug: true,
    name: true,
    description: true,
    videoCount: true,
    category: { select: { slug: true, name: true } },
  } satisfies Parameters<typeof db.folder.findMany>[0] extends never ? never : object;
}

/** Approved folders ordered by content volume, paginated. */
export async function listApprovedFolders(
  page: number,
  categorySlug?: string | null,
): Promise<{ items: FolderListItem[]; total: number; totalPages: number }> {
  const where = {
    ...APPROVED_FOLDER_WHERE,
    videoCount: { gt: 0 },
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  };

  const [total, items] = await Promise.all([
    db.folder.count({ where }),
    db.folder.findMany({
      where,
      orderBy: [{ videoCount: "desc" }, { listedAt: "desc" }],
      select: folderSelect() as never,
      skip: (page - 1) * FOLDERS_PER_PAGE,
      take: FOLDERS_PER_PAGE,
    }),
  ]);

  return { items: items as FolderListItem[], total, totalPages: Math.max(1, Math.ceil(total / FOLDERS_PER_PAGE)) };
}

/** Categories that actually contain approved folders (for navigation). */
export async function listActiveCategories(): Promise<
  { slug: string; name: string; description: string; folderCount: number }[]
> {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      _count: { select: { folders: { where: { ...APPROVED_FOLDER_WHERE, videoCount: { gt: 0 } } } } },
    },
  });
  return categories
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description,
      folderCount: category._count.folders,
    }))
    .filter((category) => category.folderCount > 0);
}

export async function getApprovedFolderBySlug(slug: string) {
  return db.folder.findFirst({
    where: { slug, ...APPROVED_FOLDER_WHERE },
    include: { source: { select: { name: true, slug: true, verified: true } }, category: { select: { slug: true, name: true } } },
  });
}

function videoSelect() {
  return {
    id: true,
    slug: true,
    title: true,
    durationSeconds: true,
    thumbnailUrl: true,
    viewCount: true,
    dataLoadedAt: true,
    folder: { select: { slug: true, name: true } },
  } satisfies object;
}

/** Approved videos, newest first, paginated. */
export async function listApprovedVideos(
  page: number,
  folderId?: number | null,
): Promise<{ items: VideoListItem[]; total: number; totalPages: number }> {
  const where = {
    ...APPROVED_VIDEO_WHERE,
    ...(folderId ? { folderId } : {}),
  };
  const [total, items] = await Promise.all([
    db.video.count({ where }),
    db.video.findMany({
      where,
      orderBy: { dataLoadedAt: "desc" },
      select: videoSelect() as never,
      skip: (page - 1) * VIDEOS_PER_PAGE,
      take: VIDEOS_PER_PAGE,
    }),
  ]);
  return { items: items as VideoListItem[], total, totalPages: Math.max(1, Math.ceil(total / VIDEOS_PER_PAGE)) };
}

export async function getApprovedVideoBySlug(slug: string) {
  return db.video.findFirst({
    where: { slug, ...APPROVED_VIDEO_WHERE },
    include: {
      source: { select: { name: true, slug: true, verified: true, allowsEmbed: true } },
      folder: { select: { id: true, slug: true, name: true } },
    },
  });
}

/** Related videos: same folder first, then most recent approved videos. */
export async function listRelatedVideos(videoId: number, folderId: number | null, limit = 8): Promise<VideoListItem[]> {
  const related = folderId
    ? await db.video.findMany({
        where: { ...APPROVED_VIDEO_WHERE, folderId, id: { not: videoId } },
        orderBy: { dataLoadedAt: "desc" },
        select: videoSelect() as never,
        take: limit,
      })
    : [];

  if (related.length >= limit) return related.slice(0, limit) as VideoListItem[];

  const fill = await db.video.findMany({
    where: { ...APPROVED_VIDEO_WHERE, id: { not: videoId }, folderId: { notIn: folderId ? [folderId] : [] } },
    orderBy: [{ viewCount: "desc" }, { dataLoadedAt: "desc" }],
    select: videoSelect() as never,
    take: limit - related.length,
  });

  return [...related, ...fill] as VideoListItem[];
}

export interface SearchOptions {
  query: string;
  page: number;
  category?: string | null;
  duration?: string | null;
  date?: string | null;
  sort?: string | null;
}

export interface SearchResult {
  items: VideoListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/** Duration filter buckets (seconds). */
const DURATION_BUCKETS: Record<string, { gte?: number; lt?: number }> = {
  short: { lt: 300 },
  medium: { gte: 300, lt: 900 },
  long: { gte: 900, lt: 1800 },
  extra: { gte: 1800 },
};

/** Date filter windows applied to dataLoadedAt. */
function dateCutoff(kind: string | null | undefined): Date | null {
  if (kind === "day") return new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (kind === "week") return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (kind === "month") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

/**
 * Catalog search over approved videos. Terms are ANDed; filters are applied
 * on top. Unknown filter values degrade gracefully (no filter).
 */
export async function searchApprovedVideos(options: SearchOptions): Promise<SearchResult> {
  const terms = options.query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
    .slice(0, 6);

  const duration = options.duration && DURATION_BUCKETS[options.duration]
    ? DURATION_BUCKETS[options.duration]
    : null;
  const cutoff = dateCutoff(options.date);

  const where = {
    ...APPROVED_VIDEO_WHERE,
    ...(duration ? { durationSeconds: { not: null, ...duration } } : {}),
    ...(cutoff ? { dataLoadedAt: { gte: cutoff } } : {}),
    ...(options.category ? { folder: { category: { slug: options.category } } } : {}),
    ...(terms.length > 0 ? { AND: terms.map((term) => ({ title: { contains: term } })) } : {}),
  };

  const orderBy =
    options.sort === "popular"
      ? [{ viewCount: "desc" as const }, { dataLoadedAt: "desc" as const }]
      : [{ dataLoadedAt: "desc" as const }, { viewCount: "desc" as const }];

  const [total, items] = await Promise.all([
    db.video.count({ where }),
    db.video.findMany({
      where,
      orderBy,
      select: videoSelect() as never,
      skip: (options.page - 1) * VIDEOS_PER_PAGE,
      take: VIDEOS_PER_PAGE,
    }),
  ]);

  return {
    items: items as VideoListItem[],
    total,
    page: options.page,
    totalPages: Math.max(1, Math.ceil(total / VIDEOS_PER_PAGE)),
  };
}

/**
 * Playback gate: resolve an upstream id only if the catalog contains an
 * approved entry for it on a verified, active source. This prevents the
 * playback resolver and stream relay from being probed with arbitrary
 * upstream ids that were never moderated.
 */
export async function isApprovedUpstreamVideo(upstreamId: string): Promise<boolean> {
  const count = await db.video.count({
    where: { upstreamId, ...APPROVED_VIDEO_WHERE },
  });
  return count > 0;
}

/** Verified source rows for the public /sources page. */
export async function listVerifiedSources() {
  return db.source.findMany({
    where: { verified: true, status: "ACTIVE" },
    select: {
      slug: true,
      name: true,
      homepageUrl: true,
      description: true,
      verifiedAt: true,
      allowsEmbed: true,
      _count: { select: { videos: { where: { status: "APPROVED" } } } },
    },
    orderBy: { name: "asc" },
  });
}
