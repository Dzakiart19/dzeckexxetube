import { fetchFolder } from "@/server/providers/streamrizz/upstream-client";
import { PUBLIC_ROOT_FOLDER_ID } from "@/lib/public-config";
import type { CatalogVideo } from "@/server/providers/types";

export type { CatalogVideo };

/**
 * The upstream root folder lists sub-folders (actual videos live one level
 * deeper), so "latest videos" must be collected from the newest sub-folders'
 * first pages. Fetches are bounded (folder limit + concurrency) and ride on
 * the shared upstream cache with in-flight deduplication, so repeated calls
 * from the sitemap, RSS feed, and JSON-LD injection stay cheap.
 *
 * Failures degrade gracefully: whatever succeeded is returned; if nothing
 * succeeds the result is an empty list and callers fall back to folder-only
 * output.
 */
export async function fetchLatestCatalogVideos(
  folderLimit = 8,
  concurrency = 4,
): Promise<CatalogVideo[]> {
  try {
    const root = await fetchFolder(PUBLIC_ROOT_FOLDER_ID, 1);
    const targets = root.folders.slice(0, Math.max(1, folderLimit));
    const results: CatalogVideo[] = [];

    for (let start = 0; start < targets.length; start += concurrency) {
      const chunk = targets.slice(start, start + concurrency);
      const settled = await Promise.allSettled(
        chunk.map((folder) => fetchFolder(folder.id, 1)),
      );
      for (const outcome of settled) {
        if (outcome.status !== "fulfilled") continue;
        for (const video of outcome.value.videos) {
          results.push({
            id: video.id,
            title: video.title ?? video.id,
            thumbnailUrl: video.thumbnailUrl ?? null,
          });
        }
      }
    }

    return results;
  } catch {
    // Root listing unreachable: no videos this round, static output remains.
    return [];
  }
}
