import type { Metadata } from "next";
import { Suspense } from "react";
import { FolderView } from "@/components/folders/FolderView";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

export const metadata: Metadata = {
  title: "Folder",
  description: "Jelajahi isi folder: subfolder dan video.",
  robots: { index: false, follow: false },
};

function FolderPageFallback() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="h-8 w-64 rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-48 rounded-md bg-muted animate-pulse" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_item, index) => (
          <SkeletonCard key={index} variant="video" />
        ))}
      </div>
    </div>
  );
}

export default async function FolderPage({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params;
  return (
    <Suspense fallback={<FolderPageFallback />}>
      <FolderView folderId={folderId} />
    </Suspense>
  );
}
