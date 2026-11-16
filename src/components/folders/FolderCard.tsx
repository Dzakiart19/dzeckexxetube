import Link from "next/link";
import { FolderClosed } from "lucide-react";
import { folderPath } from "@/lib/urls";

export interface FolderCardView {
  slug: string;
  name: string;
  description: string;
  videoCount: number;
  categoryName?: string | null;
}

/**
 * Catalog folder card: neutral visual, explicit video count, optional
 * category label. Folder names are moderated before they can reach here.
 */
export function FolderCard({ folder }: { folder: FolderCardView }) {
  return (
    <Link
      href={folderPath(folder.slug)}
      className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-primary transition-colors group-hover:border-primary/40">
          <FolderClosed className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
            {folder.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {folder.videoCount} video
            {folder.categoryName ? ` · ${folder.categoryName}` : ""}
          </p>
        </div>
      </div>
      {folder.description ? (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{folder.description}</p>
      ) : null}
    </Link>
  );
}
