# PLAN: slices

Vertical slices only: each one is a thin complete path a visitor could use, and each ends with build, smoke test, screenshots, commit.

| # | Slice | Delivers (what a visitor can now do) | Blocked by | Status |
|---|---|---|---|---|
| 0 | Media pipeline | One command turns raw files into web files: background-removed stills, GLB models from STEP, muted MP4 clips with posters. Run for the hero images | - | done |
| D | Design direction (Phase 4) | Allen picks one of three home-page variants built on real content | 0 | done: A's colors, B's layout |
| 1 | Home + lead case study | Home with name, role, work list, contact; the micro-vibration canceller case study end to end; responsive, tested | D | done |
| 2 | Terrament + 3D viewer | Gravity storage case study with click-to-load 3D viewers for every design generation in order (geared module, six-pin concept, linear harmonic drive; Allen asked for the earlier iterations) and the animation | 1 | done |
| 3 | Robotic arm + weld rig | Two more case studies; arm viewer (hand to forearm) | 2 | done |
| 4 | Short entries | Buggy analysis, TouchDesigner clips, motorized couch, bolted flange | 1 | done |
| 5 | About + resume | About with experience and skills; web resume and generated PDF (done 2026-09-21). Later, with Allen: a project description for the Curtiss-Wright entry, written inside naval-nuclear limits (some identifiers and phrasing are restricted, others are not), drafted from what Allen tells us; the knowledge log stays closed | 1 | done (CW description pending Allen) |
| 6 | Finish | Privacy note, accessibility line, employer disclaimer, 404, social preview images, structured data, `ASSETS.md` complete | 1-5 | done (privacy text pending Allen) |
| R | Review gauntlet (Phase 6) | All gates green or waived | 6 | done (performance gate to re-check on the live URL) |
| L | Launch (Phase 7) | Preview URL on Allen's phone and laptop, then production (accounts and domain are Allen's call) | R | ready: scripts/launch-wizard.sh, needs Allen |
| H | Handoff | "How to add a project" steps, handoff note | L | README written; final note after launch |

Status values: todo, doing, done, dropped (with reason).

Adding a project later = a new folder in `content/work/<slug>/` (text plus a media list), run the media command, done. Slice H writes the exact steps.

---

# v4: from-scratch rebuild, direction A "test cell at night" (started 2026-09-27)

Allen's brief (2026-09-27): rebuild design and layout from scratch, keep the experience content and the 3D CAD views (the Terrament explode above all), "as cool as possible, as many bells and whistles as possible", outside inspiration, local test preview before anything goes live. Direction picked by looking at `/lab/a|b|c`: **A** (test cell at night), keep the waveform, and more CAD models on the home page (as C did). Branch `redesign/v4`; nothing is pushed.

Architecture decisions
- Content layer stays: `content/work/*` MDX and media, `src/lib/*`, the media pipeline, every route and URL, the resume PDF pipeline.
- Everything visual is rebuilt: tokens, fonts (Big Shoulders display, Azeret Mono text), layout, components. Old components are deleted as their last user goes.
- 3D runs on the project's own three.js stage (`src/components/stage/engine.ts`, three 0.183.2 already shipped inside model-viewer), replacing model-viewer at runtime. model-viewer stays only for poster rendering in the media pipeline.
- Dark is the identity; a "lights" toggle offers a light sheet. Motion and sound have site toggles on top of the OS setting; sound is off by default.
- WebGL canvases mount when near the viewport and dispose when far, so the home page never holds more than a few contexts.

| # | Slice | Delivers | Verify | Status |
|---|---|---|---|---|
| v4-1 | Shell | New tokens and fonts, header with nav, footer, skip link, motion/sound/lights prefs (applied before paint), 404; home hero with the live hand and hero readouts | build; smoke desktop; screenshots 390/768/1440 looked at; tells | todo |
| v4-2 | Home instruments | Canceller band with the scope; Terrament pinned explode with readouts and slider; specimen shelf (six-pin concept, harmonic drive, canceller shield) with shaded / wireframe / x-ray modes | as above, plus reduced-motion twin tests: explode moves with scroll when allowed, stays put (slider still works) when reduced | todo |
| v4-3 | Home index | Work index with hover preview (fine pointer only), experience as a test log, contact | as above | todo |
| CP-1 | Checkpoint | /simplify, /code-review on the diff; Allen sees the home page at localhost | review findings fixed | todo |
| v4-4 | Case study template | `/work/[slug]` rebuilt: title block, instrument readouts for role/team/when/tools, hero, MDX prose, Figure/Strip/Video/Clips/Model/PartsFigure restyled, Model on the new stage, next project | all 8 case pages render; viewer tests rewritten | todo |
| v4-5 | Other pages | About, resume screen style (print stays white paper; PDF reprinted), privacy | resume drift test passes | todo |
| v4-6 | Bells | Ctrl/Cmd-K command palette (jump, toggles), opt-in WebAudio sound, cross-document view transitions, live waveform strip that answers scroll speed, section readout rail, text scramble | each has a keyboard path and a reduced-motion state; interaction tests | todo |
| CP-2 | Checkpoint | /simplify, /code-review, /security-review | findings fixed | todo |
| v4-7 | Cleanup and tests | Remove lab pages and dead components, model-viewer runtime dependency, update smoke/a11y/finish tests | full suite green both profiles | todo |
| v4-R | Review gauntlet | Impeccable critique + audit, tells, detect, axe, Lighthouse median of 3, Emil review-animations, mobile-native | gates green or listed for Allen | todo |
| v4-P | Preview | Production build served on :3200 for Allen; DESIGN.md, DECISIONS-LOG, HANDOFF updated | Allen looks; publishing stays his yes | todo |
