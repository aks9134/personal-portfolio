---
name: Allen Sun, portfolio (v4)
description: A mechanical design engineer's work, shown like a test cell at night with the instruments on.
colors:
  bg: "oklch(0.17 0.006 70)"
  bg-2: "oklch(0.205 0.007 70)"
  bg-3: "oklch(0.245 0.008 70)"
  fg: "oklch(0.93 0.015 85)"
  muted: "oklch(0.75 0.014 80)"
  rule: "oklch(0.93 0.015 85 / 0.16)"
  rule-strong: "oklch(0.93 0.015 85 / 0.42)"
  accent: "oklch(0.8 0.145 72)"
  on-accent: "oklch(0.17 0.006 70)"
  oxide: "oklch(0.68 0.16 38)"
  plate: "oklch(0.9 0.012 85)"
  light-bg: "oklch(0.945 0.012 85)"
  light-fg: "oklch(0.19 0.008 70)"
  light-accent: "oklch(0.52 0.13 62)"
typography:
  display:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "clamp(5rem, 17vw, 15.5rem)"
    fontWeight: 800
    lineHeight: 0.84
    letterSpacing: "-0.005em"
  section:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "clamp(3rem, 7vw, 6.5rem)"
    fontWeight: 800
    lineHeight: 0.84
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  lead:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.35
  readout:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.07em"
rounded:
  none: "0"
  balloon: "9999px"
spacing:
  gutter: "16px"
  gutter-md: "32px"
  section: "96px"
  max: "1600px"
components:
  button:
    textColor: "{colors.fg}"
    typography: "{typography.readout}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "0 14px"
  button-pressed:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  switch:
    textColor: "{colors.muted}"
    typography: "{typography.readout}"
  switch-on:
    textColor: "{colors.fg}"
  link:
    textColor: "{colors.fg}"
  link-hover:
    textColor: "{colors.accent}"
---

# Design System: Allen Sun, portfolio (v4)

Chosen 2026-09-27 by Allen, by looking at three built directions (`/lab/a`, `/lab/b`, `/lab/c`, since deleted): **A, "test cell at night"**, keeping the scope waveform and adding more CAD models to the home page as C did. Everything before v4 (the goldenrod "shop traveler" sheet) is retired.

## Overview

**Creative North Star: "The test cell at night."** A dyno bay with the lights down and the instruments on. The hardware sits under work lights in the middle of the floor; the numbers that matter glow sodium amber on the instruments around it. Every live value on the site (part count, travel in mm, percent apart, the scope trace, dates, statuses) is an instrument reading, and the CAD models are the hardware on the floor.

The site is dark whatever the OS says, because the dark bay is the identity. The Lights switch brings the bay lights up (a bone sheet with black ink) and is remembered. Motion is maximal by Allen's request (2026-09-27, "as many bells and whistles as possible"), but every moving thing has an off state: the OS reduced-motion setting and the site's own Motion switch both stop it, script-driven motion included.

**Key characteristics**
- Warm black floor, bone text, amber for live values and focus only
- Condensed industrial capitals for display; a sturdy grotesk for reading; mono only for readings
- Real CAD in WebGL (self-hosted three.js): the hand in the hero, the Terrament drive taken apart by scroll, three more models on a shelf with Solid / Edges / X-ray
- Square corners, hairline rules, no shadows, no glow

## Colors

- **Floor** (`bg`), **bench** (`bg-2`, panels behind models and images), **raised** (`bg-3`, the active row in the jump menu).
- **Bone** (`fg`): text and model edge lines. **Muted** (`muted`): secondary text.
- **Sodium amber** (`accent`): live values, the scope trace, focus rings, pressed buttons, the current page, text selection and the caret. In the light sheet it deepens (`light-accent`) to hold text contrast.
- **Oxide** (`oxide`): reserved for "before" traces; not used yet.
- **Plate** (`plate`): see-through images (renders, ink drawings, plots) were made for paper, so in the dark they sit on a bone plate. In the light sheet the plate is transparent.

**The Amber Rule.** Amber means "this is a reading or a live control". If it is neither, it is bone.

## Typography

- **Display:** Big Shoulders 800, uppercase, line-height 0.84. Name, page titles, section titles, project titles in the index.
- **Text:** Schibsted Grotesk. Body 1.125rem at 1.6 in case studies (65ch), 1.25rem leads.
- **Readout:** Azeret Mono 500, 0.8125rem, uppercase, 0.07em tracking, tabular figures. Only for data and measurements: dates, counts, mm, statuses, instrument labels, switches. Never for sentences (Impeccable's craft floor: mono is not a costume).
- All three are self-hosted by `next/font` at build time.

**The No-Eyebrow Rule.** No small label above a heading. Context lines (course, year, award) go under the heading.

## Layout

A 1600px floor with 16px gutters (32px from 768px). Sections are separated by a hairline rule and 96px of air. The home page runs: hero (name and live hand), canceller with the scope, the pinned Terrament take-apart (320svh of scroll with the model pinned), the models shelf (three across on desktop), the work index (cases large, short entries in a four-up grid), experience, then the footer (waveform, email set large, links, switches). Case studies: title block, a four-cell facts row, the parts figure or hero, then prose at 65ch with a sticky section index on wide screens.

## Elevation & Depth

Flat. Depth comes from the floor/bench/raised steps and hairline rules. No shadows, no blur, no glow; the X-ray render mode uses normal blending, never additive.

## Shapes

Square corners everywhere. The only curve is the amber balloon that rings a part in a numbered exploded view, as on a drawing.

## Components

- **Buttons** (`.btn`): bordered, mono label, amber fill when pressed (`aria-pressed`), scale 0.97 on press.
- **Switches** (Lights, Motion, Sound): mono labels with a small square that fills amber when on. In the header on wide screens, in the footer everywhere.
- **Jump menu** (Ctrl/Cmd K, or the Jump to button): native modal dialog, no open animation.
- **3D views** (`src/components/stage/*`): poster first, live model when near (the hero after load and idle; on touch screens after the first touch), freed when far. Drag, arrow keys or Turn buttons. Models over 1.5 MB wait for a Load button on case pages.
- **Explode**: scroll drives it while pinned; the slider is the same control and scrolls the page to match. With motion off it is a plain figure and the slider moves the parts.
- **Scope**: replays Test 2 from the published figures, labelled as a redraw, with Canceller and Hold.
- **Waveform** (footer): excited by scroll speed, rings down, then stops.

## Do's and Don'ts

- Do show real hardware and real CAD; don't draw fake UI or decoration where the work should be.
- Do keep every number traceable to the write-ups; the scope says it is a redraw.
- Don't use purple, neon, glow, glass, gradients, grid backgrounds, marquees, custom cursors or scroll-jacking. The explode pins a section but never takes over the wheel.
- Don't give two elements on one page the same `view-transition-name`.

## Sources

- Research brief and notes: `_notes/redesign-inspiration.md` (Awwwards SOTD and SOTY 2023 to 2026: Oryzo by Lusion, Igloo Inc, Lando Norris by OFF+BRAND, Opal Tadpole, Active Theory V6, Bruno Simon 2025, teenage engineering OP-XY, JUNNI split-flap), read 2026-09-27.
- Direction A palette and type from that brief's "Test cell at night" direction, adapted: body text moved from mono to Schibsted Grotesk per Impeccable's craft floor.
