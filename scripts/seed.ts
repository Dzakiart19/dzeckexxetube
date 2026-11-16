/**
 * Catalog seed script.
 *
 * Runs a bounded, moderated sync of the verified source and stores the
 * result in SQLite. Safe to re-run: entries are upserted, moderation
 * decisions (REMOVED / UNDER_REVIEW / REJECTED) are never overwritten.
 *
 * Usage: bun run scripts/seed.ts [maxFolders] [videosPerFolder]
 */
import { syncCatalog } from "../src/server/catalog/sync";
import { PrismaClient } from "@prisma/client";

async function main() {
  const maxFolders = Number(process.argv[2] ?? "") > 0 ? Number(process.argv[2]) : 12;
  const videosPerFolder = Number(process.argv[3] ?? "") > 0 ? Number(process.argv[3]) : 24;

  console.log(`[seed] syncing catalog (maxFolders=${maxFolders}, videosPerFolder=${videosPerFolder})...`);
  const stats = await syncCatalog({ maxFolders, videosPerFolder });
  console.log("[seed] sync finished:", stats);

  const prisma = new PrismaClient();
  const [approvedVideos, approvedFolders, rejectedVideos] = await Promise.all([
    prisma.video.count({ where: { status: "APPROVED" } }),
    prisma.folder.count({ where: { status: "APPROVED", videoCount: { gt: 0 } } }),
    prisma.video.count({ where: { status: "REJECTED" } }),
  ]);
  await prisma.$disconnect();

  console.log(
    `[seed] catalog: ${approvedFolders} approved folders, ${approvedVideos} approved videos, ${rejectedVideos} auto-rejected videos`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
