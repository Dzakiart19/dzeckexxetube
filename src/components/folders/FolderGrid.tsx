import { FolderCard, type FolderCardView } from "@/components/folders/FolderCard";

/** Responsive folder grid used by home, explore and category pages. */
export function FolderGrid({ folders }: { folders: FolderCardView[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {folders.map((folder) => (
        <FolderCard key={folder.slug} folder={folder} />
      ))}
    </div>
  );
}
