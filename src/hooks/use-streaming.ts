"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { playbackResultSchema } from "@/lib/api-schemas";
import type { PlaybackResult } from "@/lib/types";

/**
 * Server-state hook for playback resolution. `refreshNonce` > 0 appends
 * ?refresh=1 so retries can bypass server-side caches (used by the player's
 * "Coba lagi" flow). The video must be an approved catalog entry; the API
 * enforces this server-side.
 */
export function usePlayback(upstreamId: string, refreshNonce = 0) {
  return useQuery({
    queryKey: ["playback", upstreamId, refreshNonce],
    queryFn: ({ signal }) =>
      apiRequest<PlaybackResult>(
        `/api/videos/${encodeURIComponent(upstreamId)}/playback${refreshNonce > 0 ? "?refresh=1" : ""}`,
        { signal, schema: playbackResultSchema },
      ),
    staleTime: 30_000,
    retry: false,
  });
}
