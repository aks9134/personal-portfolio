// node scripts/hover.mjs <url> <scrollSelector> <hoverSelector> <out.png> — capture after hovering an element.
import { chromium } from "@playwright/test";
const [url, sel, hov, out] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: "networkidle" });
await p.locator(sel).first().evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.12));
await p.waitForTimeout(800);
await p.locator(hov).first().hover();
await p.waitForTimeout(120);
await p.screenshot({ path: out.replace(".png", "-mid.png") });
await p.waitForTimeout(700);
await p.screenshot({ path: out });
await b.close();
