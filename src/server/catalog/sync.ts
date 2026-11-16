import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { PUBLIC_SITE_NAME } from "@/lib/public-config";
import { isAllowedThumbnailUrl } from "@/server/security/allowlist";
import { fetchFolder } from "@/server/upstream/upstream-client";
import {
  CATEGORY_DEFINITIONS,
  folderCatalogDescription,
  moderateText,
  moderationReasonLabel,
  categorizeFolder,
  videoCatalogDescription,
} from "@/server/moderation/moderation";
import { uniqueSlug } from "@/server/catalog/slugify";

/**
 * Catalog sync service.
 *
 * Pulls a bounded slice of the verified source's public listing pages and
 * stores it as a moderated local catalog. This is the only path through
 * which content can become visible: nothing is auto-indexed in bulk, and
 * every entry must pass the automated blocklist before it is approved.
 *
 * Design rules:
 *  - bounded sync (maxFolders / videosPerFolder) so we never mirror the
 *    entire upstream catalog at once,
 *  - polite pacing between upstream calls,
 *  - rejected entries keep a moderation note for the audit log,
 *  - previously removed/under-review entries are never resurrected by sync.
 */

const SYNC_PACE_MS = 140;

export interface SyncStats {
  foldersScanned: number;
  foldersApproved: number;
  foldersRejected: number;
  videosScanned: number;
  videosApproved: number;
  videosRejected: number;
}

export interface SyncOptions {
  maxFolders?: number;
  videosPerFolder?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Human-facing source identity derived from the configured upstream host. */
function sourceIdentity(): { slug: string; name: string; homepageUrl: string } {
  const url = new URL(config.upstreamBaseUrl);
  const label = url.hostname.split(".")[0] ?? "sumber";
  const name = label.charAt(0).toUpperCase() + label.slice(1);
  return {
    slug: label.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name,
    homepageUrl: `${url.protocol}//${url.hostname}`,
  };
}

export async function ensureSource(): Promise<{ id: number; name: string; slug: string }> {
  const identity = sourceIdentity();
  const source = await db.source.upsert({
    where: { slug: identity.slug },
    create: {
      slug: identity.slug,
      name: identity.name,
      homepageUrl: identity.homepageUrl,
      description:
        "Penyedia konten pihak ketiga yang telah diverifikasi dan mengizinkan penautan kontennya melalui halaman katalog.",
      verified: true,
      verifiedAt: new Date(),
      allowsEmbed: true,
      status: "ACTIVE",
    },
    update: {
      name: identity.name,
      homepageUrl: identity.homepageUrl,
      verified: true,
      verifiedAt: new Date(),
    },
  });
  return { id: source.id, name: source.name, slug: source.slug };
}

export async function ensureCategories(): Promise<void> {
  for (const definition of CATEGORY_DEFINITIONS) {
    await db.category.upsert({
      where: { slug: definition.slug },
      create: {
        slug: definition.slug,
        name: definition.name,
        description: definition.description,
        sortOrder: definition.sortOrder,
      },
      update: {
        name: definition.name,
        description: definition.description,
        sortOrder: definition.sortOrder,
      },
    });
  }
}

/** Resolve a listing thumbnail into an allowlisted absolute URL (or null). */
function resolveThumbnail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (isAllowedThumbnailUrl(trimmed)) return trimmed;
  try {
    const joined = new URL(trimmed, config.imageCdnBaseUrl).toString();
    if (isAllowedThumbnailUrl(joined)) return joined;
  } catch {
    // fall through
  }
  try {
    const joined = new URL(trimmed, config.upstreamBaseUrl).toString();
    if (isAllowedThumbnailUrl(joined)) return joined;
  } catch {
    // fall through
  }
  return null;
}

async function logModeration(entry: {
  action: string;
  entityType: string;
  entityId?: number | null;
  actor?: string;
  reason?: string | null;
  detail?: unknown;
}): Promise<void> {
  await db.moderationLog.create({
    data: {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      actor: entry.actor ?? "system-auto",
      reason: entry.reason ?? null,
      detail: entry.detail ? JSON.stringify(entry.detail) : null,
    },
  });
}

interface UpsertVideoInput {
  sourceId: number;
  folderId: number;
  sourceName: string;
  upstreamId: string;
  rawTitle: string | null;
  rawThumbnail: string | null;
}

/** Strip markup junk, file-host branding and extension suffixes from titles. */
function cleanCatalogTitle(raw: string): string {
  return raw
    .replace(/\+/g, " ")
    .replace(/[#*_~`|<>{}[\]]+/g, " ")
    // Strip file-host branding suffixes ("- DoodStream", "DoodStream.com"...).
    .replace(/\s*[-–]\s*doodstream.*$/gi, " ")
    .replace(/doodstream\.?\S*/gi, " ")
    // Strip "at <file-host>" trailing brand mentions and site refs.
    .replace(/\s+at\s+[a-z0-9.-]+\s*(com|net|org|xyz|to|io|cc|tv)\s*$/gi, " ")
    .replace(/join\s+tele(gram)?\s*@?\S+/gi, " ")
    .replace(/telegram\s*@[\w-]+/gi, " ")
    // Strip bare off-platform invites ("Tele @channel", "TG @user").
    .replace(/\b(?:tele|tg|telegram)\s*@\w+/gi, " ")
    // Strip file extensions and trailing/leading junk separators.
    .replace(/\.(mp4|mkv|mov|avi|wmv|webm)\s*$/gi, " ")
    .replace(/\s*[-–|]\s*$/, "")
    .replace(/^[.\s]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

async function upsertVideo(input: UpsertVideoInput): Promise<"approved" | "rejected" | "kept"> {
  const fallbackTitle = `Video ${input.upstreamId}`;
  const title = input.rawTitle && cleanCatalogTitle(input.rawTitle).length > 0
    ? cleanCatalogTitle(input.rawTitle)
    : fallbackTitle;
  const thumbnailUrl = resolveThumbnail(input.rawThumbnail);

  const existing = await db.video.findUnique({
    where: { sourceId_upstreamId: { sourceId: input.sourceId, upstreamId: input.upstreamId } },
  });

  const verdict = moderateText(title);

  if (existing) {
    if (
      existing.status === "REMOVED" ||
      existing.status === "UNDER_REVIEW" ||
      existing.status === "REJECTED"
    ) {
      // A moderation decision wins over a re-sync: never resurrect.
      return "kept";
    }
    if (!verdict.approved) {
      await db.video.update({
        where: { id: existing.id },
        data: {
          status: "REJECTED",
          moderationNote: `${moderationReasonLabel(verdict.reason!)} (${verdict.matched ?? "unknown"})`,
          updatedAt: new Date(),
        },
      });
      await logModeration({
        action: "AUTO_REJECT",
        entityType: "VIDEO",
        entityId: existing.id,
        reason: verdict.reason,
        detail: { matched: verdict.matched },
      });
      return "rejected";
    }
    await db.video.update({
      where: { id: existing.id },
      data: {
        title,
        thumbnailUrl,
        description: videoCatalogDescription(input.sourceName, PUBLIC_SITE_NAME),
        status: "APPROVED",
        moderationNote: null,
        updatedAt: new Date(),
      },
    });
    return "kept";
  }

  if (!verdict.approved) {
    const created = await db.video.create({
      data: {
        slug: await uniqueSlug("video", title, input.upstreamId),
        sourceId: input.sourceId,
        folderId: input.folderId,
        upstreamId: input.upstreamId,
        title,
        description: videoCatalogDescription(input.sourceName, PUBLIC_SITE_NAME),
        thumbnailUrl,
        status: "REJECTED",
        moderationNote: `${moderationReasonLabel(verdict.reason!)} (${verdict.matched ?? "unknown"})`,
      },
    });
    await logModeration({
      action: "AUTO_REJECT",
      entityType: "VIDEO",
      entityId: created.id,
      reason: verdict.reason,
      detail: { matched: verdict.matched },
    });
    return "rejected";
  }

  const created = await db.video.create({
    data: {
      slug: await uniqueSlug("video", title, input.upstreamId),
      sourceId: input.sourceId,
      folderId: input.folderId,
      upstreamId: input.upstreamId,
      title,
      description: videoCatalogDescription(input.sourceName, PUBLIC_SITE_NAME),
      thumbnailUrl,
      status: "APPROVED",
      listedAt: new Date(),
    },
  });
  await logModeration({
    action: "AUTO_APPROVE",
    entityType: "VIDEO",
    entityId: created.id,
    reason: null,
    detail: { slug: created.slug },
  });
  return "approved";
}

interface UpsertFolderInput {
  sourceId: number;
  sourceName: string;
  upstreamId: string;
  rawName: string | null;
  videosPerFolder: number;
}

async function upsertFolderWithVideos(
  input: UpsertFolderInput,
  stats: SyncStats,
): Promise<number | null> {
  const name = (input.rawName && input.rawName.trim().length > 0
    ? input.rawName.trim().slice(0, 120)
    : `Folder ${input.upstreamId}`)
    // Upstream embeds the item count in the link text ("19 Januari (7)");
    // the catalog exposes its own verified videoCount instead.
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim() || `Folder ${input.upstreamId}`;
  const verdict = moderateText(name);
  // Every folder gets a category: keyword match or the neutral fallback.
  const categorySlug = categorizeFolder(name) ?? "umum";

  const existing = await db.folder.findUnique({
    where: { sourceId_upstreamId: { sourceId: input.sourceId, upstreamId: input.upstreamId } },
    include: { category: true },
  });

  if (existing && (existing.status === "REJECTED" || existing.status === "HIDDEN")) {
    return null;
  }

  if (!verdict.approved) {
    const note = `${moderationReasonLabel(verdict.reason!)} (${verdict.matched ?? "unknown"})`;
    if (existing) {
      await db.folder.update({
        where: { id: existing.id },
        data: { status: "REJECTED", moderationNote: note, updatedAt: new Date() },
      });
    } else {
      const created = await db.folder.create({
        data: {
          slug: await uniqueSlug("folder", name, input.upstreamId),
          sourceId: input.sourceId,
          upstreamId: input.upstreamId,
          name,
          description: folderCatalogDescription(name, input.sourceName),
          status: "REJECTED",
          moderationNote: note,
        },
      });
      await logModeration({
        action: "AUTO_REJECT",
        entityType: "FOLDER",
        entityId: created.id,
        reason: verdict.reason,
        detail: { matched: verdict.matched },
      });
    }
    stats.foldersRejected += 1;
    return null;
  }

  let categoryId: number | null = null;
  if (categorySlug) {
    const category = await db.category.findUnique({ where: { slug: categorySlug } });
    categoryId = category?.id ?? null;
  }

  const folder = existing
    ? await db.folder.update({
        where: { id: existing.id },
        data: {
          name,
          categoryId,
          status: "APPROVED",
          moderationNote: null,
          listedAt: existing.listedAt ?? new Date(),
          updatedAt: new Date(),
        },
      })
    : await db.folder.create({
        data: {
          slug: await uniqueSlug("folder", name, input.upstreamId),
          sourceId: input.sourceId,
          upstreamId: input.upstreamId,
          name,
          description: folderCatalogDescription(name, input.sourceName),
          categoryId,
          status: "APPROVED",
          listedAt: new Date(),
        },
      });

  // Sync the first listing page of this folder, bounded and paced.
  try {
    const listing = await fetchFolder(input.upstreamId, 1);
    let processed = 0;
    for (const video of listing.videos) {
      if (processed >= input.videosPerFolder) break;
      const outcome = await upsertVideo({
        sourceId: input.sourceId,
        folderId: folder.id,
        sourceName: input.sourceName,
        upstreamId: video.id,
        rawTitle: video.title,
        rawThumbnail: video.thumbnailUrl ?? null,
      });
      if (outcome === "approved") stats.videosApproved += 1;
      if (outcome === "rejected") stats.videosRejected += 1;
      stats.videosScanned += 1;
      processed += 1;
    }
  } catch (error) {
    logger.warn("catalog sync: folder listing unavailable", {
      folder: input.upstreamId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }

  const approvedCount = await db.video.count({
    where: { folderId: folder.id, status: "APPROVED" },
  });
  await db.folder.update({
    where: { id: folder.id },
    data: { videoCount: approvedCount, updatedAt: new Date() },
  });

  stats.foldersApproved += 1;
  return folder.id;
}

/**
 * Run a bounded catalog sync. Safe to call repeatedly: every step is an
 * upsert, moderation decisions are preserved, and empty folders are not
 * approved for display.
 */
export async function syncCatalog(options: SyncOptions = {}): Promise<SyncStats> {
  const maxFolders = Math.max(1, Math.min(options.maxFolders ?? 24, 100));
  const videosPerFolder = Math.max(1, Math.min(options.videosPerFolder ?? 24, 60));

  const stats: SyncStats = {
    foldersScanned: 0,
    foldersApproved: 0,
    foldersRejected: 0,
    videosScanned: 0,
    videosApproved: 0,
    videosRejected: 0,
  };

  const source = await ensureSource();
  await ensureCategories();

  // Root listing: subfolders + any direct videos of the root collection.
  const root = await fetchFolder(config.upstreamRootFolderId, 1);
  stats.foldersScanned += root.folders.length + 1;

  const rootName = root.title && root.title.trim().length > 0 ? root.title : "Koleksi Utama";
  await upsertFolderWithVideos(
    {
      sourceId: source.id,
      sourceName: source.name,
      upstreamId: config.upstreamRootFolderId,
      rawName: rootName,
      videosPerFolder,
    },
    stats,
  );

  const children = root.folders.slice(0, maxFolders);
  for (const child of children) {
    await sleep(SYNC_PACE_MS);
    await upsertFolderWithVideos(
      {
        sourceId: source.id,
        sourceName: source.name,
        upstreamId: child.id,
        rawName: child.name,
        videosPerFolder,
      },
      stats,
    );
  }

  await logModeration({
    action: "SYNC_UPSERT",
    entityType: "SOURCE",
    entityId: source.id,
    actor: "system-sync",
    detail: { ...stats, maxFolders, videosPerFolder },
  });

  logger.info("catalog sync finished", { ...stats });
  return stats;
}
