/** videy provider internal/public shapes. */

import type { VideoSummary } from "@/lib/types";

export interface VideyListResponse {
  page: number;
  sort: string;
  videos: VideoSummary[];
  hasNextPage: boolean | null;
  totalPages: number | null;
  source: "upstream";
  fetchedAt: string;
}

/**
 * Server-side detail. `rawSourceUrl` is the absolutized upstream MP4 URL and
 * must never be serialized to clients.
 */
export interface VideyInternalDetail {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number | null;
  views: number | null;
  rawSourceUrl: string | null;
  fetchedAt: string;
}
