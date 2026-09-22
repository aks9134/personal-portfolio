import type { Metadata } from "next";
import { preview } from "@/lib/og";
import { SiteHeader } from "@/components/site-nav";
import { site } from "@/lib/site";

const description =
  "What this site collects (only the host's standard request logs) and how to reach Allen if something on it doesn't work for you.";

export const metadata: Metadata = {
  title: "Privacy and accessibility",
  description,
  openGraph: preview("Privacy and accessibility | Allen Sun", description),
};

const h2 = "mt-12 text-2xl font-extrabold tracking-[-0.02em] [font-stretch:108%]";

// From the framework's privacy template: it describes only what this site actually does. Update it if the host changes
// or anything that collects data is added.
export default function PrivacyPage() {
  const email = <a href={`mailto:${site.email}`} className="font-semibold underline hover:text-stamp">{site.email}</a>;
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[1400px] px-4 md:px-10">
        <div className="mt-10 max-w-[65ch] border-t-[1.5px] border-ink pt-6 md:mt-14">
          <h1 className="hyphens-auto text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] [font-stretch:110%] sm:text-5xl md:text-6xl">Privacy and accessibility</h1>
          <p className="mt-4 text-ink-2">Effective 21 September 2026</p>

          <div className="space-y-4 text-lg leading-snug">
            <h2 className={h2}>Privacy</h2>
            <p>
              This is my personal website, and it collects as little as I could manage. There are no forms, no analytics, no
              advertising and no tracking cookies, and every font, script, image and 3D model loads from this site itself, not from a
              third party.
            </p>
            <p>
              The one thing that does get recorded is the host&apos;s standard request log. Vercel, which serves the site, logs technical
              details such as your IP address, browser type and the pages you request, to keep the site running and secure. On my
              plan I can see those logs for about an hour. Vercel&apos;s own handling is described in its{" "}
              <a href="https://vercel.com/legal/privacy-notice" className="underline hover:text-stamp">privacy notice</a>.
            </p>
            <p>
              Because nothing here tracks you across sites, the site behaves the same whether or not your browser sends Do Not Track or
              Global Privacy Control. It isn&apos;t directed at children under 13. If you email me, I use your message only to reply.
            </p>
            <p>To ask what I hold about you, or to have it deleted, email {email}. If this page changes, the date above changes with it.</p>

            <h2 className={h2}>Accessibility</h2>
            <p>
              The site is built to WCAG 2.2 AA: it works by keyboard, respects reduced-motion settings, and every image, 3D model and
              video has a text description. The 3D models and videos load only when you ask for them.
            </p>
            <p>
              If something doesn&apos;t work with the way you browse, email {email} and tell me what you ran into. I&apos;ll fix it, or
              send you the content in another form.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
