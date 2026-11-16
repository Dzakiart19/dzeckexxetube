import { FolderCard } from "@/components/folders/FolderCard";
import type { FolderLink } from "@/lib/types";

interface FolderGridProps {
  folders: FolderLink[];
}

/** Responsive folder grid: 2 columns on mobile, up to 4 on desktop. */
export function FolderGrid({ folders }: FolderGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {folders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} />
      ))}
    </div>
  );
}
