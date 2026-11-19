import { ChevronRight, Folder } from "lucide-react";
import Link from "next/link";
import type { FolderLink } from "@/lib/types";

interface FolderCardProps {
  folder: FolderLink;
}

/** Minimal folder tile: icon, name, subtle hover lift. */
export function FolderCard({ folder }: FolderCardProps) {
  return (
    <Link
      href={`/folder/${encodeURIComponent(folder.id)}`}
      className="group flex min-h-[72px] items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/50"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Folder className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{folder.name}</span>
        <span className="block text-xs text-muted-foreground">Folder</span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}
