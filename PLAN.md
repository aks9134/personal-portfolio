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
