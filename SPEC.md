# SPEC: Allen Sun, portfolio

Phase 2, written 2026-09-21 from Allen's answers. Approved by Allen: pending.

## 1. Purpose
Get Allen interviews for product and mechanical design roles at hardware companies. In 12 months: a hiring manager who opens the site from a resume or LinkedIn link understands in 30 seconds what he designs and builds, and has at least one project worth asking him about.

## 2. Visitors
- Primary: a recruiter or hiring manager, laptop at work, 30 seconds, scanning for "relevant or not".
- Secondary: an engineer or design lead who opens one or two case studies and reads for process and judgment, 5 minutes.
- Some arrive on a phone from LinkedIn.

## 3. The one action
Email Allen (or open his LinkedIn). Reachable from every page.

## 4. Pages
| Page | What a visitor must be able to do or learn | Real content? |
|---|---|---|
| Home `/` | Who he is and what he does in one screen; the lead project visible without scrolling; the work list; current role; contact | Yes |
| Case study `/work/[slug]` (x4) | Problem, constraints, process, what failed, result, his role; photos, renders, drawings; 3D viewer where a file exists | Yes |
| Short entry `/work/[slug]` (x4) | One screen: what it is, what he did, one or two images or videos | Yes (couch and TouchDesigner thin but enough) |
| About `/about` | Short human intro, experience (Curtiss-Wright, Ergami, Terrament), skills and tools, education | Yes |
| Resume `/resume` | Web resume plus a PDF download, same facts, public-safe (no phone, generic Curtiss-Wright text) | Yes |
| Privacy `/privacy` | Short note: no tracking, host logs only | Template |

Navigation: Work, About, Resume, Email. No hamburger on desktop.

## 5. Content inventory
Facts and sources live in `_notes/<project>.md`. Employer gate per `knowledge/legal.md` 5.3.

| Project | Kind | Format | Media | 3D viewer | Gate |
|---|---|---|---|---|---|
| Micro-vibration canceller (Senior Design) | School, team of 4 | Case study, lead | Rig photo (first-build shield), final render, labeled exploded view, FEA plots, control diagram, Test 1 plot, simulation plots, drawing MH-P01 | No (no SolidWorks license; stills only) | School. Teammates named (Allen OK'd) |
| Gravity storage drive (Terrament) | Employer, internship | Case study | Physical prototype photo, Fusion screenshots, 25 s animation (Allen's), renders from old PDF | Yes: geared module (Final Assembly) and linear harmonic designs (New Assembly, New Assembly 2) | Approved in writing (Allen, 2026-09-18). Company claims attributed to Terrament |
| Robotic arm (Advanced CAD) | School | Case study | Renders (carbon and aluminum), drawings, wrist FEA plots, motion-study clip | Yes: hand, palm, wrist, forearm (Oct 2024 file) | School. Partner not named; copy credits Allen's sections only |
| TPU weld rig (Ergami) | Employer, internship | Case study | Rig photo, exploded render (both from old PDF) | No (STLs are flat channel strips) | Approved in writing. No dimensions or process parameters beyond "oven at 500 F" |
| Buggy analysis (FEA course) | School, team | Short | Deformation plot, drag set-up, residuals | No (downloaded model) | School. Allen ran collision and drag; teammates not named; model described as downloaded |
| TouchDesigner experiments | Personal | Short | 5 clips, muted, UI cropped, retitled | No | Personal. Credit MediaPipe TouchDesigner components |
| Motorized couch | Personal, high school | Short | 2 cut-out photos (small) | No | Personal |
| Bolted flange joint (Machine Design) | School, team | Short | 2 drawings | No | School. GE source material not reproduced |

Experience entries (text): Curtiss-Wright (approved generic text), Ergami, Terrament.
Missing, and fine without: higher-res final capstone photo, full-arm CAD, couch build photos.

## 6. Out of scope (and when to add)
- Contact form: when email stops being enough.
- Analytics: if Allen wants numbers, cookieless (Vercel Web Analytics) plus a privacy line.
- Blog or CMS: never for this; projects are text files.
- EG 1003 hand, FEA labs, controls labs, Measurement Systems: when better media exists.
- Full-arm and capstone 3D models: if a SolidWorks export becomes possible.

## 7. Look and feel
Allen: "professional but cool, through the lens of an aspiring product designer." No references given, so the direction is decided by looking: three variants on real content in Phase 4. Product stills on the page's off-white (background removed). Light by default, dark offered. Figma route B (code first, chosen variant pushed to Figma for markup).

## 8. Practical
- Domain: Allen's call (costs money). Site works on a free Vercel address until then.
- Hosting: Vercel Hobby plus a private GitHub repo as backup (Allen creates both accounts; asked before first deploy).
- Analytics: none. Contact: `mailto:aks9134@nyu.edu` and LinkedIn.
- Updates: each project is one folder (text file plus media list). A script turns raw files (photos, renders, STEP/STL, video) into web versions. Written steps for adding a project.

## 9. Legal row
Static portfolio only (self-hosted fonts and assets, no third-party requests): short privacy note mentioning host logs (P), accessibility contact line (P), `ASSETS.md`, license notices, employer and export gate, "Views and work shown are my own and do not represent my employer."

## 10. Quality bar
WORKFLOW Phase 6 gates. Plus: every number on the site traces to a line in `_notes/`; no claim beyond what the source reports support; 3D viewers load only on click and work by keyboard and touch; videos never autoplay with sound.

## 11. Assumptions
1. The Senior Design case leads the home page (faculty-voted best ME senior design project 2025, built and machined by Allen), unless the Phase 4 variants show another lead reads better.
2. Stills get backgrounds removed only where the result is clean; close-ups keep theirs.
3. The public resume PDF is generated from the `/resume` page, so the two can't drift.
4. No photo of Allen (not answered; add later by dropping one in).
5. English only, US audience.

## 12. Open questions
None blocking. Domain and hosting accounts are asked at launch.
