import { config } from "@/lib/config";
import { UpstreamNotFoundError } from "@/lib/errors";
import type { PlaybackResult, VideoDetail } from "@/lib/types";
import type { CacheStat, CatalogVideo, DiscoveryParams, DiscoveryResult, InternalPlayback, ListSort, UpstreamProvider } from "@/server/providers/types";
import { fetchInternalVideyDetail, fetchVideyList, getVideyCacheStats } from "./client";
import { fetchVideyPlayback, getVideyPlaybackCacheStats, resolveVideyInternalPlayback } from "./resolver";

/**
 * videy provider (platform 2): flat video listing with sort options
 * (terbaru/trending/lama) and direct MP4 playback via watch.php.
 */

function normalizeSort(sort?: ListSort | null): ListSort {
  return sort === "trending" || sort === "lama" ? sort : "terbaru";
}

export const videyProvider: UpstreamProvider = {
  id: "videy",

  async getDiscovery(params: DiscoveryParams): Promise<DiscoveryResult> {
    const sort = normalizeSort(params.sort);
    const list = await fetchVideyList(params.page, sort, { refresh: params.refresh });
    return {
      page: list.page,
      title: null,
      folders: [],
      videos: list.videos,
      hasNextPage: list.hasNextPage,
      totalPages: list.totalPages,
      fetchedAt: list.fetchedAt,
    };
  },

  async getVideoDetail(videoId: string, options?: { refresh?: boolean }): Promise<VideoDetail> {
    const internal = await fetchInternalVideyDetail(videoId, options);
    return {
      id: internal.id,
      title: internal.title,
      thumbnailUrl: internal.thumbnailUrl,
      playbackUrl: null,
      playbackSource: "none",
      duration: internal.duration,
      expiresAt: null,
      views: internal.views,
      upstreamMetadata: {},
      fetchedAt: internal.fetchedAt,
    };
  },

  async resolvePublicPlayback(videoId: string, options?: { refresh?: boolean }): Promise<PlaybackResult> {
    return fetchVideyPlayback(videoId, options);
  },

  async resolveInternalPlayback(videoId: string, options?: { refresh?: boolean }): Promise<InternalPlayback> {
    return resolveVideyInternalPlayback(videoId, options);
  },

  /**
   * Catalog for SEO surfaces: the newest listing pages flattened. Bounded by
   * page count and concurrency; rides the shared list cache and degrades to
   * an empty array when upstream is unreachable.
   */
  async getCatalogVideos(limit = 40, concurrency = 4): Promise<CatalogVideo[]> {
    const results: CatalogVideo[] = [];
    try {
      const first = await fetchVideyList(1, "terbaru");
      const totalPages = Math.min(first.totalPages ?? 1, 2);
      const pages = Array.from({ length: Math.max(1, totalPages) }, (_value, index) => index + 1);
      const collected: CatalogVideo[] = first.videos.map((video) => ({
        id: video.id,
        title: video.title ?? video.id,
        thumbnailUrl: video.thumbnailUrl ?? null,
      }));

      for (let start = 1; start < pages.length; start += concurrency) {
        const chunk = pages.slice(start, start + concurrency);
        const settled = await Promise.allSettled(
          chunk.map((page) => fetchVideyList(page, "terbaru")),
        );
        for (const outcome of settled) {
          if (outcome.status !== "fulfilled") continue;
          for (const video of outcome.value.videos) {
            collected.push({
              id: video.id,
              title: video.title ?? video.id,
              thumbnailUrl: video.thumbnailUrl ?? null,
            });
          }
        }
      }

      results.push(...collected.slice(0, Math.max(1, limit)));
      return results;
    } catch {
      return [];
    }
  },

  relayHeaders(): Record<string, string> {
    return {
      "User-Agent": config.videyUserAgent,
      Referer: config.videyReferer,
    };
  },

  cacheStats(): Record<string, CacheStat> {
    return {
      list: getVideyCacheStats().list,
      videos: getVideyCacheStats().videos,
      playback: getVideyPlaybackCacheStats(),
    };
  },
};

// Re-exported for direct imports where a typed error shape is handy.
export { UpstreamNotFoundError };
