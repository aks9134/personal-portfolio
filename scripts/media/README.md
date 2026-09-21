# Media pipeline

Turns raw files (photos, renders, STEP models, videos) into web files. Sources stay on this machine (`Info Repository/`, `_notes/media/`, neither is in git). Outputs in `public/work/<slug>/` and `content/work/<slug>/media.generated.json` are committed.

## Run

```bash
npm run media                          # every project, only items whose entry changed
npm run media -- robotic-arm           # one project
npm run media -- robotic-arm --force   # redo everything for that project
```

## One-time setup (only needed for `cutout`)

```bash
python -m venv .venv-media
.venv-media/Scripts/python -m pip install "rembg[cpu]" pillow
```

## `content/work/<slug>/media.json`

A list of entries. `out` is the output name, `src` the source path from the project root, `alt` the description of what it shows. The file extension picks the handler.

| Source | Output | Optional fields |
|---|---|---|
| `.png` `.jpg` `.jpeg` | `<out>.webp` (EXIF and GPS removed) | `crop` [left, top, width, height] in source pixels; `cutout` true (background removal, then trim); `flatten` true (see-through margins become white paper, for drawings); `trim` true (for images that already have a transparent background); `width` (default 1600) |
| `.pdf` + `pdfObject` | same as images, from a JPEG embedded in the PDF | as above. Object numbers: see `_notes/RESUME.md` or list them with the snippet in the git history |
| `.step` `.stp` | `<out>.glb`, meshopt-compressed | `deflection` (default 0.002, smaller = finer), `color` "#rrggbb", `metallic`, `roughness` |
| `.mov` `.mp4` | `<out>.mp4` muted H.264 + `<out>-poster.webp` | `crop` "w:h:x:y", `start`, `duration` (seconds), `width` (default 1280), `posterAt` (seconds) |

Look at every output before using it. Background removal fails on close-ups and cluttered photos: keep those as framed photos (drop `cutout`, use `crop`).
