import type { FolderLink, PlaybackSourceKind, PlaybackResult, ResolverStatus, VideoDetail, VideoSummary } from "@/lib/types";

/**
 * Provider abstraction for multi-platform upstream sources.
 *
 * Every platform (streamrizz, videy, ...) implements this interface so the
 * API layer, relay, and SEO surfaces stay platform-agnostic. Providers own
 * their parsing, caching, and allowlist validation; raw upstream URLs and
 * tokens never leave the server.
 */

export type PlatformId = "streamrizz" | "videy";

export type ListSort = "terbaru" | "trending" | "lama";

export interface DiscoveryParams {
  page: number;
  sort?: ListSort | null;
  refresh?: boolean;
}

export interface CacheStat {
  size: number;
  hits: number;
  misses: number;
}

/** Normalized root listing shared by folder-based and flat-list platforms. */
export interface DiscoveryResult {
  page: number;
  title: string | null;
  folders: FolderLink[];
  videos: VideoSummary[];
  hasNextPage: boolean | null;
  totalPages: number | null;
  fetchedAt: string;
}

/** Flattened video entry for SEO surfaces (sitemap, feed, JSON-LD). */
export interface CatalogVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
}

/**
 * Server-side playback resolution result. `rawUrl` is the allowlisted
 * upstream URL — it must never be serialized to a client.
 */
export interface InternalPlayback {
  videoId: string;
  status: ResolverStatus;
  playbackUrl: string | null;
  playbackSource: PlaybackSourceKind;
  rawUrl: string | null;
  posterUrl: string | null;
  expiresAt: string | null;
  fetchedAt: string;
}

export interface UpstreamProvider {
  readonly id: PlatformId;
  /** Root listing: folders + videos for the platform home/discovery surface. */
  getDiscovery(params: DiscoveryParams): Promise<DiscoveryResult>;
  /** Public video detail (no raw URLs, no tokens). */
  getVideoDetail(videoId: string, options?: { refresh?: boolean }): Promise<VideoDetail>;
  /** Public playback resolution for the playback API route. */
  resolvePublicPlayback(videoId: string, options?: { refresh?: boolean }): Promise<PlaybackResult>;
  /** Server-only resolution for the stream relay (includes rawUrl). */
  resolveInternalPlayback(videoId: string, options?: { refresh?: boolean }): Promise<InternalPlayback>;
  /** Bounded latest-videos catalog for sitemap/feed/JSON-LD. Degrades to []. */
  getCatalogVideos(limit?: number, concurrency?: number): Promise<CatalogVideo[]>;
  /** Realistic headers (UA/Referer) the stream relay must send upstream. */
  relayHeaders(): Record<string, string>;
  /** Per-provider cache statistics for the health endpoint. */
  cacheStats(): Record<string, CacheStat>;
}
