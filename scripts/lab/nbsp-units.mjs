// node scripts/lab/nbsp-units.mjs [--write]  Joins a number to its unit with a no-break space in every write-up, so
// "1000 N" or "54 Hz" never splits across lines. Without --write it only lists what it would change.
import fs from "node:fs";

const unit = String.raw`(?:kN|N|kHz|Hz|mm|cm|ms|kg|g|mV\/g|mV|V|W|MPa|GPa|psi|rpm|lbf|lb|in\.|ft|µm|μm|kΩ|MΩ|Ω|°C)`;
const re = new RegExp(String.raw`(\d) (${unit})(?=[\s.,;:)\]!?"'’]|$)`, "gm");
const write = process.argv.includes("--write");
let total = 0;
for (const slug of fs.readdirSync("content/work")) {
  const f = `content/work/${slug}/index.mdx`;
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, "utf8");
  const hits = [...src.matchAll(re)].map((m) => src.slice(Math.max(0, m.index - 12), m.index + m[0].length + 2).replace(/\n/g, " "));
  total += hits.length;
  if (hits.length) console.log(slug, hits.length, hits.slice(0, 4));
  if (write && hits.length) fs.writeFileSync(f, src.replace(re, "$1 $2"));
}
console.log(total, write ? "joined" : "would be joined");
