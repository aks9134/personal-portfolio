#!/usr/bin/env node
// check-tells.mjs: deterministic scan for Allen's 30 "vibe coded" tells (knowledge/ai-tells.md).
// Zero dependencies. Usage: node scripts/check-tells.mjs [dir ...] [--strict]
// ERROR = banned outright, exits 1. WARN = needs a human look, exits 0 unless --strict.
// Silence one line with a trailing comment containing: tells-ok: <reason>
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const given = args.filter((a) => !a.startsWith('--'));
const roots = (given.length ? given : ['src', 'app', 'components', 'content']).filter(existsSync);
const EXT = new Set(['.tsx', '.jsx', '.ts', '.js', '.mjs', '.css', '.mdx', '.md', '.html', '.astro', '.vue', '.svelte']);
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'out', 'build', 'coverage', 'test-results', 'playwright-report']);
const HUES = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

// [tell number, level, label, regex, advice]
const LINE_RULES = [
  [1, 'WARN', 'gradient', /\bbg-(?:gradient|linear|conic)-|(?:linear|conic)-gradient\(/, 'flat color or a barely-there same-hue gradient'],
  [2, 'ERROR', 'lucide icons', /from\s+['"]lucide-react['"]|lucide-/, 'Phosphor or Tabler, one set, per-icon imports'],
  [3, 'WARN', 'pure white / pure black', /\bbg-white\b|\bbg-black\b|#fff(?:fff)?\b|#000(?:000)?\b|background(?:-color)?:\s*(?:white|black)\b/i, 'tinted neutrals from the token set'],
  [5, 'WARN', 'heavy shadow', /\bshadow-(?:lg|xl|2xl)\b|\bdrop-shadow(?:-|\()/, 'border or background shift, or the token shadow'],
  [7, 'ERROR', 'emoji', /\p{Extended_Pictographic}/u, 'words, or a real icon with a label'],
  [8, 'WARN', 'glass / blur', /\bbackdrop-blur|backdrop-filter|liquid[-_ ]?glass/i, 'solid surface; blur only where content truly passes beneath'],
  [9, 'ERROR', 'em or en dash', /[—–]|&mdash;|&ndash;/, 'period, comma, colon, parentheses, or a plain hyphen'],
  [10, 'ERROR', 'default AI font', /\b(?:Inter|Geist(?:_Mono|Mono)?|Space_Grotesk|Roboto)\b\s*[({]|font-family:[^;]*\b(?:Inter|Geist|Space Grotesk|Roboto|Arial)\b|from\s+['"]geist\//, 'a face chosen with /impeccable typeset, self-hosted'],
  [11, 'WARN', 'colored side stripe', new RegExp(`\\bborder-l-(?:2|4|8)\\b|border-left:\\s*[2-9]px|\\bborder-l-(?:${HUES})-`), 'drop it; use spacing, weight or an icon'],
  [12, 'ERROR', 'placeholder person or company', /\b(?:John|Jane) Doe\b|\bSarah Ch[ae]n\b|\bAcme\b|\bLorem ipsum\b/i, 'real content or a visible TODO that cannot ship'],
  [12, 'WARN', 'testimonial', /testimonial/i, 'real, verbatim, permission on file (legal.md 4.2) or remove'],
  [13, 'WARN', 'bento grid', /bento/i, 'a layout driven by content priority'],
  [14, 'WARN', 'fake terminal window', /bg-red-[45]00[^\n]{0,80}bg-yellow-[45]00[^\n]{0,80}bg-green-[45]00|terminal[-_ ]?window|FakeTerminal/i, 'a real screenshot, real photo, or nothing'],
  [15, 'WARN', '"it\'s not X, it\'s Y" copy', /\b(?:isn['’]t|is not|it['’]s not|not just|not only|aren['’]t|more than just)\b[^.!?\n<]{0,70}[,;.:]\s*(?:it['’]s|it is|they['’]re|but|this is)\b/i, 'say the positive claim directly'],
  [16, 'WARN', 'checkmark bullets', /[✓✔✅]|\b(?:Check|CheckCircle|CircleCheck|CheckIcon)\b[^\n]*\/>/, 'plain list, or sentences'],
  [17, 'WARN', 'pricing tiers', /pricing[-_ ]?(?:tier|card|table|section)|\bMost Popular\b/i, 'only if the product really has these plans'],
  [20, 'WARN', 'purple / violet / indigo', /\b(?:bg|text|from|via|to|border|ring|shadow)-(?:purple|violet|indigo|fuchsia)-\d{2,3}\b/, 'the project palette'],
  [22, 'WARN', 'radial orb / glow blob', /radial-gradient\(|\bbg-radial\b|\bblur-(?:2xl|3xl)\b/, 'remove; atmosphere comes from type, color and imagery'],
  [23, 'WARN', 'dot or grid background', /dot[-_ ]?(?:grid|pattern)|grid[-_ ]?pattern|background-size:\s*\d+px\s+\d+px|\[background-size:/i, 'remove unless it organizes real content'],
  [24, 'ERROR', 'sparkle / magic icon', /\bSparkles?\b|\bWandSparkles\b|\bMagicWand\b|✨/, 'name the feature in words'],
  [25, 'WARN', 'animated arrow', /group-hover:(?:translate-x|-?translate-x|ml-|pl-)|arrow[^\n]{0,40}animate-|animate-bounce/, 'a static arrow, or none'],
  [28, 'COUNT', 'hover transform', /\bhover:(?:scale|-translate-y|translate-y|rotate)-|whileHover/, ''],
  [29, 'WARN', 'neon / glow', /shadow-\[0_0_|drop-shadow-\[0_0|text-shadow:[^;]*\b0\s+0\s+\d|#39ff14|#0ff\b|#f0f\b|#00ffff|#ff00ff/i, 'desaturate; no outer glows'],
];

const files = [];
const walk = (d) => { for (const n of readdirSync(d)) { if (SKIP.has(n)) continue; const p = join(d, n); const s = statSync(p); s.isDirectory() ? walk(p) : EXT.has(extname(n)) && files.push(p); } };
roots.forEach((r) => (statSync(r).isDirectory() ? walk(r) : files.push(r)));

const findings = []; const hueAll = new Set(); const huePastel = new Set();
let hoverCount = 0, roundedBig = 0, threeCol = 0, all = '';
for (const f of files) {
  const text = readFileSync(f, 'utf8'); all += text + '\n';
  text.split(/\r?\n/).forEach((line, i) => {
    if (/tells-ok:/.test(line)) return;
    for (const [n, level, label, re, advice] of LINE_RULES) {
      // Copy rules (7, 9, 15) look at what a visitor could read, so code comments are ignored.
      let subject = line;
      if (n === 7 || n === 9 || n === 15) {
        if (/^\s*(?:\/\/|\/\*|\*|\{\s*\/\*)/.test(line)) continue;
        subject = line.replace(/\s\/\/\s.*$/, '').replace(/\/\*.*?\*\//g, '');
      }
      if (n === 7) subject = subject.replace(/[\u00a9\u00ae\u2122\u2190-\u21ff]/g, '');
      if (!re.test(subject)) continue;
      if (level === 'COUNT') { hoverCount++; continue; }
      findings.push({ n, level, label, advice, where: `${relative('.', f)}:${i + 1}`, text: line.trim().slice(0, 110) });
    }
    for (const m of line.matchAll(new RegExp(`\\b(?:bg|text|from|via|to|border)-(${HUES})-(\\d{2,3})\\b`, 'g'))) { hueAll.add(m[1]); if (+m[2] <= 200 && /bg-/.test(m[0])) huePastel.add(m[1]); }
    roundedBig += (line.match(/\brounded-(?:2xl|3xl|\[2[0-9]px\]|\[3[0-9]px\])/g) || []).length;
    threeCol += (line.match(/\b(?:md:|lg:|sm:)?grid-cols-3\b/g) || []).length;
  });
}
const agg = (n, level, label, advice, text) => findings.push({ n, level, label, advice, where: '(whole project)', text });
if (hueAll.size > 4) agg(4, 'WARN', 'rainbow coloring', 'one dominant color, one accent, semantic colors only', `${hueAll.size} hue families: ${[...hueAll].join(', ')}`);
if (huePastel.size >= 3) agg(30, 'WARN', 'basic pastel set', 'a committed palette, not one pastel per card', `pastel backgrounds in: ${[...huePastel].join(', ')}`);
if (threeCol) agg(6, 'WARN', 'three-column grid', 'confirm it is not three identical icon+title+text cards', `${threeCol} use(s) of grid-cols-3`);
if (roundedBig > 6) agg(19, 'WARN', 'soft radius everywhere', 'use the radius scale in DESIGN.md', `${roundedBig} uses of rounded-2xl or larger`);
if (hoverCount > 4) agg(28, 'WARN', 'hover animation everywhere', 'keep hover motion for the few elements that earn it', `${hoverCount} hover transforms`);

// Absence checks: tells 21, 26, 27
const has = (re) => re.test(all);
const routeExists = (name) => files.some((f) => new RegExp(`[\\\\/]${name}[\\\\/](?:page|index)\\.`).test(f)) || files.some((f) => new RegExp(`[\\\\/]${name}\\.(?:mdx?|html|astro)$`).test(f));
const collects = has(/<form\b|@vercel\/analytics|plausible|umami|gtag\(|googletagmanager|posthog/i);
const accounts = has(/next-auth|@clerk\/|@supabase\/|stripe|lemonsqueezy|paddle/i);
if (collects && !routeExists('privacy')) agg(27, 'ERROR', 'no privacy policy', 'add /privacy (legal.md 2.6 and decision table)', 'site has a form or analytics but no privacy route');
if (accounts && !routeExists('terms')) agg(26, 'ERROR', 'no terms of service', 'add /terms as clickwrap (legal.md 6)', 'site has accounts or payments but no terms route');
if (has(/\bawait fetch\(|useSWR|useQuery|\bSuspense\b/) && !has(/skeleton/i) && !files.some((f) => /loading\.(?:t|j)sx?$/.test(f))) agg(21, 'WARN', 'no loading state', 'skeleton or loading.tsx for anything that waits on data', 'data fetching found, no skeleton or loading file');

findings.sort((a, b) => a.n - b.n);
for (const x of findings) console.log(`${x.level.padEnd(5)} #${String(x.n).padStart(2)} ${x.label}  ${x.where}\n        ${x.text}${x.advice ? `\n        instead: ${x.advice}` : ''}`);
const errors = findings.filter((x) => x.level === 'ERROR').length, warns = findings.length - errors;
console.log(`\n${files.length} files scanned in [${roots.join(', ') || 'nothing found'}]: ${errors} error(s), ${warns} warning(s).`);
console.log('Not machine-checkable, check by eye: #18 real product or project visuals (no fake demos), #12 testimonial authenticity, overall layout sameness.');
process.exit(errors || (strict && warns) ? 1 : 0);
