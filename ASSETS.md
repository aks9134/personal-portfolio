# ASSETS: license record

Every image, font, icon set, video and third-party file on the site. If it is not in this table it does not ship. See `knowledge\legal.md` 5.1 and 5.2.

Paths: `IR` = `Info Repository` (never committed), `NM` = `_notes/media` (extracted copies, not committed). Published copies live in `public/work/<slug>/` with content-hashed names, made by `npm run media` from the sources below (`content/work/<slug>/media.json` is the machine-readable version of this table). Link-preview cards in `public/og/` are made from the same heroes by `npm run og`.

## Project media

| File (media name) | What it is | Source | Author / owner | License | Date added | Employer gate |
|---|---|---|---|---|---|---|
| micro-vibration-canceller: device-render, exploded, sem1-exploded | Team CAD renders and labeled exploded views | `IR/Senior Design/.../Report Figures/VI_Iso.PNG`, `VI_Lab.png`; `IR/Senior Design/.../CAD/Images/Labeled Explo (2).png` | Allen and his Senior Design team (named on the page) | Own coursework, shown with the team's credit | 2026-09-21 | school |
| micro-vibration-canceller: rig-photo, final-photo | Photos of the device on the test rig | `NM/senior-design/fabrev_image32.jpg`, `portfolio_final-device-photo.jpg` | Allen / team | Own work | 2026-09-21 | school |
| micro-vibration-canceller: fea-plate, control-diagram, test1-plot, solver-failure, sim-result, rig-cad, wiring | Report and poster figures (FEA, block diagram, test and simulation plots, rig CAD, circuit) | `NM/senior-design/*` (from the team's final report, poster and Fall deck) | Allen / team | Own coursework | 2026-09-21 | school |
| gravity-storage-drive: prototype-photo, harmonic-render, harmonic-exploded | Prototype photo and linear harmonic renders | `IR/Engineering Portfolio (3).pdf`, image objects 50, 69, 70 | Allen's work at Terrament | Published with Terrament's written approval | 2026-09-21 | approved (Terrament, 2026-09-18) |
| gravity-storage-drive: geared-module, pin-concept, harmonic-drive (+ posters) | 3D models of the three design generations, and posters rendered from them | `IR/Terrament/Final Assembly Model.step`, `New Assembly.step`, `New Assembly 2.step` | Terrament CAD Allen worked on | Published with Terrament's written approval; no STEP download offered | 2026-09-21 | approved (Terrament, 2026-09-18) |
| gravity-storage-drive: module-animation (+ poster) | Exploded-view animation of the geared module | `IR/Terrament/Portfolio Images/Terrament/1st Iteration Design/Oringal Annimation File v10.mp4` | Allen (confirmed 2026-09-21) | Own work, Terrament-approved | 2026-09-21 | approved (Terrament) |
| robotic-arm: arm-carbon, arm-aluminum, forearm-final | Final renders of the arm | `IR/Robotic Arm/.../RenderedImages/RenderedImagesArm/Blackened1.png`, `Silver1.png`, `Blackened5.jpg` | Allen and his course partner (partner unnamed by Allen's choice) | Own coursework | 2026-09-21 | school |
| robotic-arm: hand-model (+ poster) | 3D model of Allen's hand, palm, wrist and forearm (Oct 2024) | `NM/robotic-arm/HD-AS00001 v12.step` (from the course zip) | Allen | Own coursework | 2026-09-21 | school |
| robotic-arm: fea-push, fea-inline, midterm-hand, forearm-midterm | Wrist FEA plots, midterm hand render, midterm forearm screenshot | `NM/robotic-arm/report_image4.png`, `report_image2.png`, `midpres_image7.png`, `midpres_image5.png` | Allen / course team | Own coursework | 2026-09-21 | school |
| tpu-weld-rig: rig-photo, rig-exploded | Photo of the finished rig and its exploded render | `IR/Engineering Portfolio (3).pdf`, image objects 53, 51 | Allen's work at Ergami | Published with Ergami's written approval; no dimensions beyond the 500 F oven | 2026-09-21 | approved (Ergami, 2026-09-18) |
| buggy-analysis: collision-deformation, drag-setup | ANSYS result and Fluent setup screenshots | `NM/buggy-fea/pres_image16.png`, `pres_image3.png` | Allen's simulations; the buggy CAD itself was a downloaded model and is described as such | Own coursework | 2026-09-21 | school |
| touchdesigner: swipe-filter, energy-hands, fingertip-arcs, rift, framed-filter (+ posters) | Screen recordings of Allen's TouchDesigner effects, muted, title bar cropped | `IR/Touch Designer/Insta Videos-.../*.mov` | Allen (everyone on camera is Allen) | Own work; hand tracking by the MediaPipe TouchDesigner components, credited on the page | 2026-09-21 | personal |
| motorized-couch: couch-side, couch-front | Photos of the couch (background removed) | `IR/Motorized Couch/IMG_0757-removebg-preview.png`, `IMG_0756-removebg-preview.png` | Allen | Own work | 2026-09-21 | personal |
| bolted-flange: bolt-layout, bolt-hardware | Team drawings of the flange bolt layout and bolt stack | `NM/survey/img/MD_Bolt_image4.png`, `MD_Bolt_image3.png` (from the Machine Design report) | Allen and his course team | Own coursework; the course-supplied GE load table and hood model are not used | 2026-09-21 | school |
| `public/allen-sun-resume.pdf` | The resume, printed from `/resume` by `npm run resume:pdf` | this site | Allen | Own work | 2026-09-21 | Curtiss-Wright: approved generic text only |

## Code, fonts and libraries that ship to the browser

| Package or file | What it is | Source | Author | License | Date added |
|---|---|---|---|---|---|
| Archivo (via `next/font`, self-hosted at build) | The site's typeface | Google Fonts, downloaded at build time and served from this site | Omnibus-Type | SIL Open Font License 1.1 | 2026-09-21 |
| `@google/model-viewer` 4.3.1 | 3D viewer web component, loaded only on click | npm | Google | Apache-2.0 | 2026-09-21 |
| `three` 0.183.2 (bundled inside model-viewer) | 3D rendering | npm | three.js authors | MIT | 2026-09-21 |
| `public/vendor/meshopt_decoder.js` | Mesh decompression for the 3D models (three's copy of the meshoptimizer decoder, `export` line removed) | npm `three/examples/jsm/libs/meshopt_decoder.module.js` | Arseny Kapoulkine | MIT (header kept in the file) | 2026-09-21 |
| Next.js 16.3.5, React 19.2.8 | Framework runtime | npm | Vercel, Meta | MIT | 2026-09-18 |

Build-only tools (never sent to visitors): sharp (Apache-2.0), ffmpeg-static (GPL-3.0 binary, used locally to transcode video), occt-import-js (LGPL-2.1), gltf-transform (MIT), meshoptimizer encoder (MIT), rembg (MIT), Playwright (Apache-2.0).

Rules: Allen's own work, licensed stock with receipt, Unsplash or Pexels under their licenses, or CC0. No images from search results or other sites. Fonts under OFL or Apache, or a purchased web license. No "free for personal use" fonts. No CC-NC or CC-ND.
