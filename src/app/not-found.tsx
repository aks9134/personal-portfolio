import type { Metadata } from "next";
import { Top } from "@/components/lab/console/case-scan";
import { allWork } from "@/lib/work";

export const metadata: Metadata = { title: "Page not found" };

// Any URL the site doesn't have lands here, with the work list as the way back.
export default async function NotFound() {
  const work = await allWork();
  return (
    <main id="main" className="lab-console lc-page">
      <div className="lcr-top">
        <div className="lc-frame" aria-hidden><i /><i /><i /><i /></div>
        <Top label="No signal" />
      </div>
      <div className="lc-pg">
        <p className="lc-dim">Error 404</p>
        <h1>Page not found</h1>
        <div className="lc-prose mt-6">
          <p>That address doesn&apos;t match anything here. It may have moved, or the link had a typo. Here&apos;s everything that is here:</p>
        </div>
        <ul className="lc-index lc-index-flat">
          {work.map((w, i) => (
            <li key={w.slug}>
              <a href={`/work/${w.slug}`}>
                <span className="lc-dim">{String(i + 1).padStart(2, "0")}</span>
                <b>{w.title}</b>
                <span className="lc-dim">{w.context}, {w.year}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="lc-exp-more">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain anchors keep the view transitions */}
          <a href="/">Back to the home page</a>
        </p>
      </div>
    </main>
  );
}
