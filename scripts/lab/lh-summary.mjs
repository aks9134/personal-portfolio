// node scripts/lab/lh-summary.mjs <prefix> [name...]  Lighthouse JSON reports in review-shots/lighthouse: per run the four
// category scores, simulated and observed LCP, TBT and CLS, then the median per page.
import fs from "node:fs";

const [prefix = "v5", ...names] = process.argv.slice(2);
const pages = names.length ? names : ["home", "case"];
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
for (const n of pages) {
  const runs = [1, 2, 3].map((i) => JSON.parse(fs.readFileSync(`review-shots/lighthouse/${prefix}-${n}-${i}.json`, "utf8")));
  const rows = runs.map((r) => {
    const c = r.categories;
    const m = r.audits.metrics.details.items[0];
    return {
      perf: Math.round(c.performance.score * 100),
      a11y: Math.round(c.accessibility.score * 100),
      bp: Math.round(c["best-practices"].score * 100),
      seo: Math.round(c.seo.score * 100),
      lcp: Math.round(r.audits["largest-contentful-paint"].numericValue),
      lcpObs: m.observedLargestContentfulPaint,
      tbt: Math.round(r.audits["total-blocking-time"].numericValue),
      cls: Number(r.audits["cumulative-layout-shift"].numericValue.toFixed(3)),
    };
  });
  rows.forEach((x, i) => console.log(n, i + 1, JSON.stringify(x)));
  const keys = Object.keys(rows[0]);
  console.log(n, "median", JSON.stringify(Object.fromEntries(keys.map((k) => [k, med(rows.map((x) => x[k]))]))));
  const fails = runs[0].categories.accessibility.auditRefs.filter((a) => runs[0].audits[a.id].score === 0).map((a) => a.id);
  if (fails.length) console.log(n, "accessibility audits failing:", fails.join(", "));
}
