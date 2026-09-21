# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Primary: a hiring manager or recruiter at a hardware startup (NYC or remote) hiring a product design engineer. Laptop at work, about 30 seconds, deciding "relevant or not" from the first screen. Some arrive on a phone from a LinkedIn or resume link.
- Secondary: an engineer or design lead who opens one or two case studies and reads for process and judgment, about 5 minutes, often right before an interview.

## Product Purpose
Allen Sun's personal portfolio. It exists to get him interviews for product design engineer roles at hardware startups. Success: the first screen makes clear that he designs and builds physical products, and at least one case study gives an interviewer something specific to ask about. The one action is emailing him or opening his LinkedIn.

## Positioning
He takes a part from CAD through machining to a test rig himself. The capstone device he machined and tested (faculty-voted Best Senior Design Project, NYU ME class of 2025), the TPU weld rig he designed and built at Ergami, the 1/24-scale prototype he assembled and wired at Terrament, and a motorized couch welded from scrap in high school. Current role: mechanical design engineer on large electric motors at Curtiss-Wright.

## Operating Context
Visitors come from a resume, LinkedIn, or a recruiter's forwarded link. Case studies are read before interviews and may be printed or saved as PDF. Allen maintains the site with Claude: each project is one folder in `content/work/<slug>/` plus `npm run media` to convert raw files.

## Capabilities and Constraints
- Pages: home, case studies (4), short entries (4), about, resume (web plus generated PDF), privacy note. Terms: see `CONTEXT.md`.
- 3D models (STEP converted to GLB) load only on click; videos never autoplay with sound.
- Employer gate (`knowledge/legal.md` 5.3): Curtiss-Wright appears only as the approved generic text, never technical material. Terrament and Ergami material is approved for release (written approval, 2026-09-18). Terrament's company metrics are attributed to Terrament, never stated as Allen's results.
- Static site, no tracking, no third-party requests, no forms.

## Brand Commitments
- Voice: `C:\Users\allen\Downloads\Allen_Sun_Writing_Voice_Framework.md` governs all copy: plain verbs, contractions, the causal chain, numbers as payoff, the part that didn't work, no self-grading adjectives, zero em dashes.
- No logo or existing visual identity. Name as text.
- Allen's framing: "professional but cool, through the lens of an aspiring product designer."

## Evidence on Hand
Fact sheets with sources in `_notes/<project>.md`; Allen's answers in `_notes/allen-answers.md` override them. Processed media in `public/work/<slug>/`: product cut-outs, photos, compressed 3D models (Terrament geared module and linear harmonic designs, robotic hand to forearm), five TouchDesigner clips.
Absent, and never to be fabricated: testimonials, client logos, test data beyond the reports, a photo of Allen, a full-arm or capstone 3D model, capstone closed-loop hardware results (simulation only).

## Product Principles
1. Show the thing. Real hardware, renders and models lead; the interface steps back.
2. Every claim traces to a source. Numbers come from the reports, stated the way the reports support them.
3. Process over polish: what failed and what changed because of it is part of every case study.
4. Thirty seconds, then five minutes: the first screen answers "who and what", the case studies reward a real read.
5. Adding a project stays a one-folder job.

## Accessibility & Inclusion
WCAG 2.2 AA. Reduced motion honored. 3D viewers and videos are keyboard and touch operable with text alternatives.
