---
name: Allen Sun, portfolio (v5)
description: A mechanical design engineer's machines, scanned into being on an instrument console.
colors:
  bg: "#05070a"
  bg-2: "#0a0e13"
  bg-3: "#111820"
  ice: "#d7e2ea"
  dim: "#6c7d89"
  muted: "#8d9ba6"
  hot: "#ff6a2b"
  line: "rgba(215, 226, 234, 0.16)"
  rule: "rgba(215, 226, 234, 0.14)"
  rule-strong: "rgba(215, 226, 234, 0.4)"
  plate: "#a3abb1"
typography:
  display:
    fontFamily: "Martian Mono (wdth 118), ui-monospace, monospace"
    fontWeight: 800
    textTransform: uppercase
    lineHeight: 1.02
  label:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.68rem"
    textTransform: uppercase
    letterSpacing: "0.08em"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "1rem to 1.1rem"
    lineHeight: 1.55
rounded:
  none: "0"
spacing:
  gutter: "48px desktop, 24px under 860px"
  reading: "64ch"
---

# Design System: Allen Sun, portfolio (v5, "Console")

Chosen 2026-10-05 by Allen from three built labs (A The Line, B Console, C Teardown), built across the whole site the same day. v4 ("test cell at night") is retired and stays in git at `20520fa`.

## Overview

**North star: the machines scan into being.** The home page is an instrument console over a pinned three.js canvas. Each of four machines appears as a point cloud sampled from its real surfaces, re-forms out of the previous machine in an outward burst, and an orange scan ring resolves it to solid; assemblies then come apart about their own centre as you scroll. Around the canvas the HTML reads as instrumentation: a target list, telemetry measured from the CAD (envelope, bodies, status, how far apart), a scan bar, and the project line once the part is solid. Each project page opens on its own machine the same way (or its lead image, resolved by the scan line), then reads as a file.

Dark only. Every moving thing stops under the OS reduced-motion setting and the site's Motion switch.

## Colors

- **Floor** `bg`; **panel** `bg-2`; **raised** `bg-3` (the active row in the jump menu).
- **Ice** `ice`: text and values. **Dim** `dim`: labels (uppercase mono). **Muted** `muted`: secondary prose.
- **Hot** `hot`: the scan, live values (scan percentage, Apart readout), focus, the one action on a page ("Open the file", Download PDF), current target, awards. Nothing else is orange.
- Cut-out images sit straight on the floor (`--bench: transparent`); ink drawings and plots invert to ice on floor; images that need paper (`ground: sheet`) keep the dimmed `plate`.

## Typography

- **Martian Mono** with its width axis at 118 for display: names, titles, section heads. The same face, small and uppercase with tracking, for labels and readouts.
- **Schibsted Grotesk** for anything read as sentences: write-ups, summaries, the resume's entries, prose pages.
- The printed resume (and its PDF) is plain: Schibsted throughout at the v4 PDF's sizes, black on white.

## Layout

- Home: pinned console (185 svh per machine weight, assemblies 1.6), then the Index of every project (featured ones tagged with their target number), then Experience (the resume entries verbatim), then the footer.
- Project file: opener (pinned 300 svh with a model, the first quarter forming it from the field; one screen with an image), summary and four facts, the write-up at reading width (36em, about 65 characters) with the section index as a list, next file.
- Write-up figures sit in line with the text, never floated: narrow ones up to 576 px, wide up to 896 px, 56 px above and below (20 px under a heading), each with an "Open full size" link. Images side by side share a row by their shapes, so they come out the same height.
- Text that sits on the canvas has a floor-coloured shade from the screen edge behind it (left and bottom on wide screens, top and bottom below 1280 px).
- Plain pages (about, privacy, resume, 404): the console top bar, a 1100 px column.
- 861 to 1279 px (tablets, narrow windows): the target list becomes a row and a file's title moves to the top, the telemetry sits bottom right, and the scene frames the machine in the band between; on screens under 821 px tall the telemetry folds to its name and scan.
- Under 860 px the same, at 24 px gutters, with the brief folded into the telemetry panel ("Open the file"). Phones (a touch pointer on a screen whose short side is under 600 px) load the 3D only after the first touch or scroll; touchscreen laptops load it at once.
- 1680 px and wider: the root size steps up (106, 112.5, then 125% from 2300 px), so type and panels grow with the screen.

## Shapes and depth

Square corners, hairline rules, corner ticks framing the viewport. Depth comes from the scene itself (fog that follows the camera, bloom on the scan and hot points); the UI is flat.

## Motion

- Scroll is eased toward the target (about 0.25 s); a long jump (a target, keys 1-4) re-forms straight into the destination; the Index link glides down in at most 0.7 s while the scene holds. The page opens on the scattered field, drawn while the models load; only the scroll forms a machine, so the top of the page always returns to the field.
- Lights and room reflections ride with the camera, so every machine is lit from the front with the orange rim behind and flat metal never mirrors a panel into the lens.
- Models built in code (canceller, weld rig, couch): the canceller's envelope carries "≈"; the weld rig and couch show "Not measured" (Allen dropped the "rebuilt" wording, 2026-10-06).

## Do's and don'ts

- Do keep every number traceable to the write-ups or measured from the CAD; an estimated size is marked ("≈", "Not measured").
- Do give the canvas an HTML equivalent: the telemetry, brief and Index work without WebGL.
- Don't add colours beyond the five; don't use orange for decoration.
- Don't put Martian Mono on long sentences.

## Sources

- Concepts and the idea method: `_notes/concepts.md`; design research (good vs bad animated portfolios, frame analysis): `_notes/design-research-2026-10-05.md`.
- Plans and critiques: `_notes/plan-v5-round6.md`, `plan-v5-round7.md`, `plan-v5-buildout.md`.
