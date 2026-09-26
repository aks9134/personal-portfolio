// Projects live in content/work/<slug>/: index.mdx (a `meta` export plus the write-up) and
// media.generated.json (written by `npm run media`). Adding a folder adds the project everywhere.
import fs from "node:fs";
import path from "node:path";
import type { MDXContent } from "mdx/types";

export type Media = {
  src: string;
  width: number;
  height: number;
  alt?: string;
  alpha?: boolean; // cut-out with a see-through background
  poster?: string;
  parts?: number;
  bytes?: number;
  orbit?: string; // 3D models: camera angle shared by the poster and the viewer
  explode?: number; // 3D models: the GLB carries an "explode" animation; value = mm the farthest part travels
  frame?: number; // 3D models: camera distance as a share of model-viewer's auto framing (poster matches)
};

export type Part = { n: number; name: string; note: string; x: number; y: number };

export type WorkMeta = {
  title: string;
  context: string; // "Senior design, NYU", "Internship, Terrament"
  year: string;
  order: number; // position on the home page; 1 leads
  format: "case" | "short";
  line: string; // one plain line for the home page and link previews
  summary: string; // the problem, what I did, the outcome: stands on its own
  status: string; // stamp text: what state the thing reached
  role: string;
  team: string;
  timeframe: string;
  tools: string;
  hero: string; // media name that leads the project page (and link previews)
  cover?: string; // media name for the home-page band, if different from the hero
  figure?: { name: string; parts: Part[] }; // numbered exploded view with a legend
  award?: string;
};

export type Work = WorkMeta & { slug: string; media: Record<string, Media>; Body: MDXContent };

const root = path.join(process.cwd(), "content", "work");

export function workSlugs(): string[] {
  return fs.readdirSync(root).filter((s) => fs.existsSync(path.join(root, s, "index.mdx")));
}

export async function getWork(slug: string): Promise<Work> {
  const mod = await import(`@content/work/${slug}/index.mdx`);
  const media = (await import(`@content/work/${slug}/media.generated.json`)).default as Record<string, Media>;
  return { slug, ...(mod as { meta: WorkMeta }).meta, media, Body: mod.default };
}

// A still for listing: videos use their poster frame.
export const still = (m: Media): Media => (m.poster ? { ...m, src: m.poster } : m);

export async function allWork(): Promise<Work[]> {
  const all = await Promise.all(workSlugs().map(getWork));
  return all.sort((a, b) => a.order - b.order);
}
