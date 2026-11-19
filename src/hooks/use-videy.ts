"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import {
  playbackResultSchema,
  videyListResponseSchema,
  videyVideoDetailSchema,
} from "@/lib/api-schemas";
import type { PlaybackResult, VideoDetail } from "@/lib/types";
import type { VideySort } from "@/lib/urls";

/**
 * Server-state hooks for the videy platform (platform 2) API.
 * `refreshNonce` > 0 appends ?refresh=1 so retries can bypass server-side
 * caches (used by the player's "Coba lagi" flow).
 */
function buildPath(base: string, params: Record<string, string | null> = {}, refreshNonce = 0): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, value);
  }
  if (refreshNonce > 0) search.set("refresh", "1");
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export interface VideyListData {
  page: number;
  sort: VideySort;
  videos: Array<{
    id: string;
    title: string | null;
    url: string;
    thumbnailUrl?: string | null;
    duration?: number | null;
    views?: number | null;
  }>;
  hasNextPage: boolean | null;
  totalPages: number | null;
  source: "upstream";
  fetchedAt: string;
}

export function useVideyVideos(page = 1, sort: VideySort = "terbaru", refreshNonce = 0) {
  return useQuery({
    queryKey: ["videy", "list", sort, page, refreshNonce],
    queryFn: ({ signal }) =>
      apiRequest<VideyListData>(
        buildPath("/api/videy/videos", { page: String(page), sort }, refreshNonce),
        { signal, schema: videyListResponseSchema },
      ),
    staleTime: 60_000,
  });
}

export function useVideyVideoDetail(videoId: string, refreshNonce = 0) {
  return useQuery({
    queryKey: ["videy", "video", videoId, refreshNonce],
    queryFn: ({ signal }) =>
      apiRequest<VideoDetail>(
        buildPath(`/api/videy/videos/${encodeURIComponent(videoId)}`, undefined, refreshNonce),
        { signal, schema: videyVideoDetailSchema },
      ),
    staleTime: 60_000,
  });
}

export function useVideyPlayback(videoId: string, refreshNonce = 0) {
  return useQuery({
    queryKey: ["videy", "playback", videoId, refreshNonce],
    queryFn: ({ signal }) =>
      apiRequest<PlaybackResult>(
        buildPath(`/api/videy/videos/${encodeURIComponent(videoId)}/playback`, undefined, refreshNonce),
        { signal, schema: playbackResultSchema },
      ),
    staleTime: 30_000,
  });
}
