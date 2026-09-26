---
name: Allen Sun, portfolio
description: A mechanical design engineer's work, printed like a shop traveler on goldenrod card stock.
colors:
  stock: "oklch(0.915 0.078 94)"
  stock-2: "oklch(0.875 0.088 91)"
  ink: "oklch(0.21 0.02 80)"
  ink-2: "oklch(0.37 0.035 80)"
  rule-soft: "oklch(0.21 0.02 80 / 0.3)"
  stamp: "oklch(0.44 0.15 262)"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 6vw, 5.25rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 110"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 108"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 118"
rounded:
  none: "0"
spacing:
  gutter: "16px"
  gutter-md: "40px"
  section: "80px"
  rule: "1.5px"
components:
  stamp:
    textColor: "{colors.stamp}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 10px"
  button-load:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  button-load-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.stock}"
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
---

# Design System: Allen Sun, portfolio

## Overview

**Creative North Star: "The Shop Traveler"**

The site is the paperwork that rides along with a part through the shop: goldenrod card stock, black print ink, and one blue stamp ink that marks what state each job reached. Every project is routed like real hardware, and the page steps back so renders, photos, drawings and 3D models carry it. This comes from the approved direction contract (`.impeccable/surfaces/src-app-page-tsx.md`), which rejects the category default of a dark hero over a grid of same-size thumbnails.

Density is editorial rather than dashboard: image-led bands on the home page, long-form case studies with figures that float into the margin, 1.5px ink rules between sections, square corners everywhere, no shadows. Images keep their true colors. See-through cut-outs sit straight on the stock; photos, plots and videos keep their own ground inside a thin ink frame. Nothing is blended with the page (Allen rejected both the yellow tint and white-on-yellow panels).

Dark mode is the same sheet at night: near-black ground, text in the stock's color, and see-through images on a stock-colored plate so black ink labels stay readable.

**Key Characteristics:**
- Goldenrod stock as the whole ground; black ink; blue used only for status, the award, and the active part
- Archivo throughout, wide and extra-bold for display and stamps
- 1.5px ink rules and frames; square corners; flat
- True-color images, never tinted by the page
- One authored motion: status stamps land as they scroll into view. The home page adds one more, asked for: the take-apart model in the vitrine

## Colors

Two inks on card stock, like a risograph print.

### Primary
- **Stamp Blue** (`stamp`): status stamps, the award stamp, the ringed part in the exploded view, focus rings, text selection and the caret. Dark mode lightens it (oklch 0.76 0.11 258) for contrast.

### Neutral
- **Goldenrod Stock** (`stock`): the page ground, and the fill of buttons that sit on images.
- **The vitrine** (`.sheet-invert`): the one inverted sheet on the home page, where the take-apart model sits. It swaps ink and stock (ink ground by day, goldenrod by night) and swaps Stamp Blue with them so focus rings keep 3:1.
- **Deep Stock** (`stock-2`): hover and focus fill on legend rows.
- **Print Ink** (`ink`): text, rules, frames, button borders; the hover fill of the 3D load button.
- **Faded Ink** (`ink-2`): secondary text (context lines, captions, dates).
- **Soft Rule** (`rule-soft`): hairline dividers inside lists and fact rows.

### Named Rules
**The One Blue Rule.** Stamp Blue marks state, never decoration: a status, the award, the active part, keyboard focus. If it isn't one of those, it's ink.

**The True Color Rule.** Images never pick up the stock. No multiply blending, no tinted overlays, no white panels behind cut-outs.

## Typography

**Display Font:** Archivo (self-hosted variable font with a width axis), fallback ui-sans-serif, system-ui
**Body Font:** Archivo
**Label Font:** Archivo, expanded
**Figure Font:** Martian Mono (self-hosted, width axis 75 to 112.5), for numbers that act as measurements only: the explode readout, the schedule's year axis, the work index numbers. Never for text or headings.

**Character:** One family doing every job. The width axis carries the voice: headings and stamps run expanded and extra-bold like stamped lettering, body text stays at normal width for reading.

### Hierarchy
- **Display** (800, 3 to 5.25rem, line-height about 0.95, expanded 110 to 112%): Allen's name on the home page and page titles.
- **Headline** (800, 1.875rem, expanded 108%): section headings and project titles in the home bands.
- **Title** (700, 1.25rem): project titles in the short-entry grid, subsection heads.
- **Body** (400, 1rem to 1.25rem for lead paragraphs, line-height about 1.5): case-study text, capped at about 62 to 65 characters per line.
- **Label** (800, 0.875rem, expanded 118%, uppercase): stamps only.

### Named Rules
**The Stamp Lettering Rule.** Uppercase belongs to stamps. Headings are sentence case.

## Layout

A single column that holds a 1400px sheet with 16px side gutters (40px from 768px up). Sections are separated by a full-width 1.5px ink rule with the heading hanging just below it. Case-study bands on the home page lay themselves out from the hero image's shape: wide images run full width, tall ones sit beside the text, the rest split about 55/45. Case-study text runs about 62ch; narrow figures float into the right margin on desktop and stack on phones. The home page's lead project shows its exploded view at about 70% width with the numbered parts legend beside it.

## Elevation & Depth

Flat. There are no shadows anywhere. Depth comes from print conventions instead: ink rules between sections, a thin ink frame around photos, videos and 3D viewports, and the stamp's slight tilt.

### Named Rules
**The Printed Sheet Rule.** If it would need a shadow to look separate, give it a rule or a frame instead.

## Shapes

Square corners on everything: frames, buttons, stamps, the 3D viewport. The only curves are the stamp-blue rings that circle a part in the exploded view. Stamps are rotated a couple of degrees, set per project so they look hand-placed.

## Components

### Stamps
- **Character:** a rubber stamp on paper.
- **Shape:** square, 2.5px Stamp Blue border, rotated about -2° to -4°.
- **Type:** label style in Stamp Blue.
- **Motion:** lands with a quick press (scale 1.25 to 0.96 to 1) as its project scrolls into view, CSS scroll-driven, screen only; off under reduced motion and on print.

### Buttons
- **Load 3D model:** a stock-filled chip with a 1.5px ink border in the bottom-left of the viewport, labelled with the file size. Hover fills it with ink and turns the text stock; press scales it to 0.97 (150ms, ease-out). The whole viewport is the hit area.
- **Download PDF:** the same chip style, on the resume page.
- **Parts legend rows:** full-width rows; hover or keyboard focus fills them with Deep Stock and rings the matching part in Stamp Blue on the drawing (200ms scale and fade).

### Navigation
- **Style:** Work, About, Resume, Email, LinkedIn as semibold text links, slightly expanded; underline on hover; wraps on narrow phones with a tighter gap. The site name leads on inner pages.

### Take-apart viewer (the vitrine's signature)
A model whose GLB carries a baked "explode" animation (media pipeline option `explode: { along, across }`) opens assembled; after loading, a native range slider labelled "Explode" scrubs it from 0 to 100% apart, drawn as a dimension line with a square Stamp Blue handle (24px), and a Martian Mono readout says "248 parts, 60% apart". Keyboard focus lands on the slider. Once, just after loading, the parts come apart to 60% over 1.4s (ease-in-out) and settle; any touch stops it and reduced motion skips it. The model file's resting pose is the exploded one, so the camera framing always has room for it.

### Hero model
The robotic hand beside the name loads on idle and never spins on its own. Scrolling turns the camera around it, a quarter degree per pixel, only while it is on screen; a drag re-bases the turn. Reduced motion keeps it still. It redraws only on scroll or drag.

### 3D viewer (signature component)
A 4:3 ink-framed viewport showing a see-through poster rendered from the model itself at the same camera angle. On click, the viewer loads (self-hosted model-viewer), the poster fades out over 200ms as the model appears, and keyboard focus moves to the model. Rotate only: zoom and pan are off so the page scroll is never trapped. A "Drag to rotate, or use the arrow keys" hint appears once it's live.

### Figures and strips
- **Figure:** an image with a small caption in Faded Ink; `narrow` figures float into the margin on desktop.
- **Strip:** two versions side by side between ink rules, like darkroom test strips, for how a design changed.
- **Clips:** silent videos in a two-column grid, native player, nothing downloads until play.

## Do's and Don'ts

### Do:
- **Do** keep the whole ground Goldenrod Stock and separate sections with a 1.5px ink rule. The vitrine is the single exception, one per page.
- **Do** show see-through images straight on the stock and frame opaque ones in 1.5px ink.
- **Do** reserve Stamp Blue for state: status, award, active part, focus.
- **Do** keep one authored motion per page and honor reduced motion.

### Don't:
- **Don't** blend images with the page or put white panels behind cut-outs (Allen rejected both).
- **Don't** use shadows, rounded cards, or a dark hero over a grid of same-size thumbnails.
- **Don't** add a second accent color or use blue for decoration.
- **Don't** use uppercase outside stamps.

## Sources

Style cards used for prototype v3 (2026-09-25), read through `knowledge\design-sources.md` in the website framework. Taken: the idea, never the brand's fonts, colors, imagery or copy.
- Refero Styles, Superlative (https://styles.refero.design/style/10ab6120-3d03-48ff-aebe-0b4910edc046): the product vitrine, a dark plate for one object.
- Refero Styles, Moving Parts (https://styles.refero.design/style/fb459c9d-c089-4d0b-b5b0-d147b1c4ebd7): a semi-mono face for measurements beside a grotesk.
- Refero Styles, teenage engineering (https://styles.refero.design/style/aecf9dda-5cba-4dc7-9e73-59b65d895cdf): hairline precision, 0 radius (already the house rule).
- MotionSites, veyra-electric (https://motionsites.ai/?prompt=veyra-electric): an engineering cutaway as the showpiece (idea only).
- Interaction reference: PYC weblog's exploded-assembly slider (https://www.pycheung.com/weblog/post/1703), found in the 2026-09-22 inspiration research.
