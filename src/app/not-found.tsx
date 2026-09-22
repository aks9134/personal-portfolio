import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-nav";
import { allWork } from "@/lib/work";

export const metadata: Metadata = { title: "Page not found" };

// Any URL the site doesn't have lands here, with the work list as the way back.
export default async function NotFound() {
  const work = await allWork();
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[1400px] px-4 md:px-10">
        <div className="mt-10 border-t-[1.5px] border-ink pt-6 md:mt-14">
          <h1 className="text-5xl font-extrabold leading-[0.98] tracking-[-0.03em] [font-stretch:110%] md:text-7xl">Page not found</h1>
          <p className="mt-6 max-w-[55ch] text-xl leading-snug">
            That address doesn&apos;t match anything here. It may have moved, or the link had a typo. Here&apos;s everything that is here:
          </p>
          <ul className="mt-8 grid max-w-3xl gap-x-10 gap-y-3 sm:grid-cols-2">
            {work.map((w) => (
              <li key={w.slug}>
                <Link href={`/work/${w.slug}`} className="text-lg font-bold underline hover:text-stamp">{w.title}</Link>
                <span className="block text-sm text-ink-2">{w.context}, {w.year}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10">
            <Link href="/" className="font-semibold underline hover:text-stamp">Back to the home page</Link>
          </p>
        </div>
      </main>
    </>
  );
}
