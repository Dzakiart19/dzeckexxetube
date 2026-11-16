/**
 * One-off re-moderation pass: re-apply the current blocklist to every
 * APPROVED catalog entry and demote failures to REJECTED with an audit
 * log entry. Folder videoCount values are recomputed afterwards.
 *
 * Usage: bun run scripts/remoderate.ts
 */
import { moderateText, moderationReasonLabel } from "../src/server/moderation/moderation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const videos = await prisma.video.findMany({
    where: { status: "APPROVED" },
    select: { id: true, title: true },
  });

  let demotedVideos = 0;
  for (const video of videos) {
    const verdict = moderateText(video.title);
    if (!verdict.approved) {
      await prisma.video.update({
        where: { id: video.id },
        data: {
          status: "REJECTED",
          moderationNote: `${moderationReasonLabel(verdict.reason!)} (${verdict.matched ?? "unknown"})`,
          updatedAt: new Date(),
        },
      });
      await prisma.moderationLog.create({
        data: {
          action: "AUTO_REJECT",
          entityType: "VIDEO",
          entityId: video.id,
          actor: "system-remoderate",
          reason: verdict.reason,
          detail: JSON.stringify({ matched: verdict.matched }),
        },
      });
      demotedVideos += 1;
    }
  }

  const folders = await prisma.folder.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true },
  });

  let demotedFolders = 0;
  for (const folder of folders) {
    const verdict = moderateText(folder.name);
    if (!verdict.approved) {
      await prisma.folder.update({
        where: { id: folder.id },
        data: {
          status: "REJECTED",
          moderationNote: `${moderationReasonLabel(verdict.reason!)} (${verdict.matched ?? "unknown"})`,
          updatedAt: new Date(),
        },
      });
      await prisma.moderationLog.create({
        data: {
          action: "AUTO_REJECT",
          entityType: "FOLDER",
          entityId: folder.id,
          actor: "system-remoderate",
          reason: verdict.reason,
          detail: JSON.stringify({ matched: verdict.matched }),
        },
      });
      demotedFolders += 1;
    }
  }

  // Recompute approved video counts per folder; folders that lost every
  // video are hidden so no empty folder is ever listed.
  const folderIds = await prisma.folder.findMany({ where: { status: "APPROVED" }, select: { id: true } });
  let emptiedFolders = 0;
  for (const { id } of folderIds) {
    const count = await prisma.video.count({ where: { folderId: id, status: "APPROVED" } });
    await prisma.folder.update({
      where: { id },
      data: { videoCount: count, ...(count === 0 ? { status: "HIDDEN", moderationNote: "Folder kosong setelah re-moderasi" } : {}) },
    });
    if (count === 0) emptiedFolders += 1;
  }

  console.log(
    `[re-moderate] videos demoted: ${demotedVideos}, folders demoted: ${demotedFolders}, folders emptied+hidden: ${emptiedFolders}`,
  );

  const [approvedVideos, approvedFolders] = await Promise.all([
    prisma.video.count({ where: { status: "APPROVED" } }),
    prisma.folder.count({ where: { status: "APPROVED", videoCount: { gt: 0 } } }),
  ]);
  console.log(`[re-moderate] catalog now: ${approvedFolders} folders, ${approvedVideos} videos`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[re-moderate] failed:", error);
    process.exit(1);
  });
