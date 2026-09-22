import type { Metadata } from "next";
import og from "./og.generated.json";
import { site } from "./site";

// Link previews (images from `npm run og`). Next merges openGraph shallowly, so every page passes the whole object:
// shared type and site name, its own title, description and image.
export function preview(title: string, description: string, image: string = og.home, alt = "Exploded view of the micro-vibration canceller"): NonNullable<Metadata["openGraph"]> {
  return { type: "website", siteName: site.name, title, description, images: [{ url: image, width: 1200, height: 630, alt }] };
}

export function projectImage(slug: string) {
  const url = (og as Record<string, string>)[slug];
  if (!url) throw new Error(`No link preview for ${slug}: run npm run og`);
  return url;
}
