# Allen Sun, portfolio

A static Next.js site: case studies and short entries about hardware Allen designed and built. No database, no tracking, no third-party requests. Design rules are in `DESIGN.md`, product rules in `PRODUCT.md`, decisions in `DECISIONS-LOG.md`.

## See it on this computer

Double-click `preview.cmd`. It opens http://localhost:3100, building and starting the site first if it isn't already running (about a minute). Close its window to stop the site.

## Put it online

`scripts/launch-wizard.sh` walks through the steps only Allen can do: a GitHub account and private repository (the backup), a Vercel account, publishing, and checking the live site. It asks before anything is uploaded or made public. Run it from this folder in Git Bash with `bash scripts/launch-wizard.sh`, or ask Claude to start it.

## Where things live

| What | Where |
|---|---|
| A project's text | `content/work/<slug>/index.mdx` (a `meta` block, then the write-up) |
| A project's media list | `content/work/<slug>/media.json` (sources and options; field reference in `scripts/media/README.md`) |
| Generated web media | `public/work/<slug>/` and `content/work/<slug>/media.generated.json` (made by `npm run media`, never edited by hand) |
| The resume | `src/lib/resume.ts` (the web page and the PDF both read it) |
| Contact details, the approved Curtiss-Wright text | `src/lib/site.ts` |
| Source material | `Info Repository/` and `_notes/` (never committed) |

## Add a project

1. **Make the folder.** `content/work/<slug>/`, where the slug is lowercase with dashes, for example `heat-exchanger`. Check the employer rules first: school and personal work are fine; employer work needs written approval, and Curtiss-Wright never goes beyond the approved text.
2. **List the media** in `media.json`, one entry per file: `out` (a short name), `src` (path to the source file), `alt` (what the image shows, for screen readers), plus options:
   - photos and renders: `crop`, `alpha: "cutout"` to cut out the background;
   - drawings and plots: `alpha: "ink"`;
   - an image inside a PDF: `pdfObject`;
   - a STEP model: `orbit` for the camera angle (try `"60deg 65deg auto"`) and `color`;
   - a video: `crop`, `start`, `duration`, `posterAt`.
3. **Make the web files:** `npm run media -- <slug>`. Look at what it wrote in `public/work/<slug>/`.
4. **Write the page** in `index.mdx`. Copy the `meta` block from a project of the same kind (`format: "case"` for a case study, `"short"` for a one-screen entry); the fields are explained in `src/lib/work.ts`. `order` sets the position on the home page, and `hero` names the image that leads. In the write-up you can use:
   - `<Figure name="..." caption="..." />` (add `narrow` to float it beside the text);
   - `<Strip items={[{ name: "...", label: "..." }, ...]} caption="..." />` for before-and-after pairs;
   - `<Model name="..." caption="..." />` for a click-to-load 3D model;
   - `<Video name="..." caption="..." />` and `<Clips items={[...]} />` for silent video.
   Copy follows `Allen_Sun_Writing_Voice_Framework.md`: no em dashes, no self-grading words, every number traceable to a source.
5. **Register it:** add `'/work/<slug>'` to `tests/site.config.ts`, then run `npm run og` for its link-preview image.
6. **Check it:** `npm run build`, then `npm test` (stop any server on port 3100 first), `npm run tells`, and look at the screenshots from `node scripts/review-shots.mjs http://localhost:3100 /work/<slug>` (with `npm run start -- -p 3100` running).
7. **Commit.**

## Update the resume

Edit `src/lib/resume.ts`, run `npm run build`, then `npm run resume:pdf`. A test fails if the resume changes without the PDF being reprinted.

## Commands

| Command | What it does |
|---|---|
| `npm run media [-- <slug>]` | Turns source files into web media (images with phone-sized copies, compressed 3D models with posters, muted video) |
| `npm run og` | Makes the 1200x630 link-preview images |
| `npm run build` | Production build |
| `npm run start -- -p 3100` | Serves the build at http://localhost:3100 (restart after every build) |
| `npm run resume:pdf` | Prints `/resume` to `public/allen-sun-resume.pdf` |
| `npm test` | Playwright: every page on desktop and phone, accessibility in light and dark, the 3D viewers, link previews, security headers |
| `npm run tells` | Scans for AI-writing and AI-design tells |

On Windows, use `npm.cmd` / `npx.cmd` in PowerShell (its script policy blocks the `.ps1` versions).
