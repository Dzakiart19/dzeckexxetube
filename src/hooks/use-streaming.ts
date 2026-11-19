"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { folderResponseSchema, playbackResultSchema, videoDetailSchema } from "@/lib/api-schemas";
import type { FolderResponse, PlaybackResult, VideoDetail } from "@/lib/types";

/**
 * Server-state hooks for the internal API. `refreshNonce` > 0 appends
 * ?refresh=1 so retries can bypass server-side caches (used by the player's
 * "Coba lagi" flow).
 */
function buildPath(base: string, page: number | null, refreshNonce: number): string {
  const params = new URLSearchParams();
  if (page !== null) params.set("page", String(page));
  if (refreshNonce > 0) params.set("refresh", "1");
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function useRootFolder(page = 1, refreshNonce = 0) {
  return useQuery({
    queryKey: ["folder", "root", page, refreshNonce],
    queryFn: ({ signal }) =>
      apiRequest<FolderResponse>(buildPath("/api/folders/root", page, refreshNonce), {
        signal,
        schema: folderResponseSchema,
      }),
    staleTime: 60_000,
  });
}

export function useFolder(folderId: string, page = 1, refreshNonce = 0) {
  return useQuery({
    queryKey: ["folder", folderId, page, refreshNonce],
    queryFn: ({ signal }) =>
      apiRequest<FolderResponse>(buildPath(`/api/folders/${encodeURIComponent(folderId)}`, page, refreshNonce), {
        signal,
        schema: folderResponseSchema,
      }),
    staleTime: 60_000,
  });
}

export function useVideoDetail(videoId: string, refreshNonce = 0) {
  return useQuery({
    queryKey: ["video", videoId, refreshNonce],
    queryFn: ({ signal }) =>
      apiRequest<VideoDetail>(buildPath(`/api/videos/${encodeURIComponent(videoId)}`, null, refreshNonce), {
        signal,
        schema: videoDetailSchema,
      }),
    staleTime: 60_000,
  });
}

export function usePlayback(videoId: string, refreshNonce = 0) {
  return useQuery({
    queryKey: ["playback", videoId, refreshNonce],
    queryFn: ({ signal }) =>
      apiRequest<PlaybackResult>(buildPath(`/api/videos/${encodeURIComponent(videoId)}/playback`, null, refreshNonce), {
        signal,
        schema: playbackResultSchema,
      }),
    staleTime: 30_000,
  });
}
