/**
 * Public (client-safe) data types shared between the API layer and the UI.
 * These shapes are part of the internal API contract and never include
 * raw embed tokens or upstream signed URLs.
 */

export interface FolderLink {
  id: string;
  name: string;
  url: string;
}

export interface VideoSummary {
  id: string;
  title: string | null;
  url: string;
  thumbnailUrl?: string | null;
}

export interface FolderResponse {
  folderId: string;
  page: number;
  title: string | null;
  folders: FolderLink[];
  videos: VideoSummary[];
  hasNextPage: boolean | null;
  source: "upstream";
  fetchedAt: string;
}

export type PlaybackSourceKind = "direct-cdn" | "fallback-stream" | "none";

export interface VideoDetail {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  playbackUrl: string | null;
  playbackSource: PlaybackSourceKind;
  duration: number | null;
  expiresAt: string | null;
  upstreamMetadata: {
    rf?: string;
    im?: string;
    ti?: string;
  };
  fetchedAt: string;
}

export type ResolverStatus = "ready" | "fallback" | "expired" | "forbidden" | "not-found" | "upstream-error";

export interface PlaybackResult {
  videoId: string;
  status: ResolverStatus;
  /** Internal relay URL for the player; raw upstream URLs are never exposed. */
  playbackUrl: string | null;
  playbackSource: PlaybackSourceKind;
  posterUrl: string | null;
  expiresAt: string | null;
  fetchedAt: string;
}
