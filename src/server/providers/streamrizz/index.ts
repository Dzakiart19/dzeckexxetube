import { config } from "@/lib/config";
import { fetchLatestCatalogVideos } from "./catalog";
import { fetchPlayback, getPlaybackCacheStats, resolveInternalPlayback as resolveStreamrizzInternal } from "./upstream-resolver";
import { fetchFolder, fetchVideoDetail, getUpstreamCacheStats } from "./upstream-client";
import type { PlaybackResult, VideoDetail } from "@/lib/types";
import type { CacheStat, CatalogVideo, DiscoveryParams, DiscoveryResult, InternalPlayback, UpstreamProvider } from "@/server/providers/types";

/**
 * Adapter that exposes the existing streamrizz (folder-based) upstream
 * implementation through the common UpstreamProvider interface.
 */

function toInternalPlayback(result: Awaited<ReturnType<typeof resolveStreamrizzInternal>>): InternalPlayback {
  // The streamrizz InternalPlaybackResult already matches the shared shape.
  return {
    videoId: result.videoId,
    status: result.status,
    playbackUrl: result.playbackUrl,
    playbackSource: result.playbackSource,
    rawUrl: result.rawUrl,
    posterUrl: result.posterUrl,
    expiresAt: result.expiresAt,
    fetchedAt: result.fetchedAt,
  };
}

export const streamrizzProvider: UpstreamProvider = {
  id: "streamrizz",

  async getDiscovery(params: DiscoveryParams): Promise<DiscoveryResult> {
    const folder = await fetchFolder(config.upstreamRootFolderId, params.page, { refresh: params.refresh });
    return {
      page: folder.page,
      title: folder.title,
      folders: folder.folders,
      videos: folder.videos,
      hasNextPage: folder.hasNextPage,
      totalPages: null,
      fetchedAt: folder.fetchedAt,
    };
  },

  async getVideoDetail(videoId: string, options?: { refresh?: boolean }): Promise<VideoDetail> {
    return fetchVideoDetail(videoId, options);
  },

  async resolvePublicPlayback(videoId: string, options?: { refresh?: boolean }): Promise<PlaybackResult> {
    return fetchPlayback(videoId, options);
  },

  async resolveInternalPlayback(videoId: string, options?: { refresh?: boolean }): Promise<InternalPlayback> {
    return toInternalPlayback(await resolveStreamrizzInternal(videoId, options));
  },

  async getCatalogVideos(limit = 8, concurrency = 4): Promise<CatalogVideo[]> {
    return fetchLatestCatalogVideos(limit, concurrency);
  },

  relayHeaders(): Record<string, string> {
    return {
      "User-Agent": config.upstreamUserAgent,
      Referer: config.upstreamReferer,
    };
  },

  cacheStats(): Record<string, CacheStat> {
    return {
      folders: getUpstreamCacheStats().folders,
      videos: getUpstreamCacheStats().videos,
      playback: getPlaybackCacheStats(),
    };
  },
};
