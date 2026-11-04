import type { Metadata } from "next";
import { GalleryItems, GalleryTitle } from "@/components/sections/gallery/GalleryScenes";
import { getLibraryItems } from "@/lib/storage/library-feed";

export const metadata: Metadata = {
  alternates: { canonical: "/gallery" },
  title: "Gallery",
  description: "Photographs, films and 3D studies from the Black Stallion Academy of Horsemanship.",
};

/**
 * The media library, as published from /admin/media. The list is cached and refreshed the moment a file is added or deleted;
 * the files themselves are served by Supabase Storage (bucket bsah-media), so they stay when the site is redeployed.
 */
export default async function GalleryPage() {
  const items = await getLibraryItems();
  return (
    <>
      <GalleryTitle count={items.length} />
      <GalleryItems items={items} />
    </>
  );
}
