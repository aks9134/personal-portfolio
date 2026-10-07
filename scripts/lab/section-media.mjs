// node scripts/lab/section-media.mjs  Each write-up's sections: how many media blocks and words each holds.
import fs from "node:fs";

for (const slug of fs.readdirSync("content/work")) {
  const f = `content/work/${slug}/index.mdx`;
  if (!fs.existsSync(f)) continue;
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  const secs = [];
  for (const line of lines) {
    if (line.startsWith("## ")) secs.push({ title: line.slice(3, 25), media: 0, words: 0 });
    else if (secs.length) {
      const s = secs[secs.length - 1];
      if (/^<(Figure|Strip|Model|Video|Clips)/.test(line.trim())) s.media++;
      else if (!line.trim().startsWith("<")) s.words += line.split(/\s+/).filter(Boolean).length;
    }
  }
  console.log(slug.padEnd(28), secs.map((s) => `${s.title} [${s.media}m ${s.words}w]`).join(" | "));
}
