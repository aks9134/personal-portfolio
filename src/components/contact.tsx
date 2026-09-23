"use client";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

// The one action, set large at the end of the page. The address is a mailto link; the button beside it copies it
// for anyone whose browser has no mail app wired up, and says so (on screen and to screen readers) when it has.
export function Contact() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (insecure context or permission): the mailto link still works.
    }
  };

  return (
    <section aria-labelledby="contact-title" data-rail="Contact" className="rise mt-24 border-t-[1.5px] border-ink pt-5">
      <h2 id="contact-title" className="text-xl leading-snug md:text-2xl">
        Want to talk about any of this?
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
        <a
          href={`mailto:${site.email}`}
          className="contact-mail text-[clamp(1.75rem,7.5vw,5.75rem)] font-extrabold leading-none tracking-[-0.03em] [font-stretch:112%]"
        >
          {site.email}
        </a>
        <button type="button" onClick={copy} className="press border-[1.5px] border-ink px-3 py-1.5 text-sm font-bold hover:bg-ink hover:text-stock">
          <span className="swap" data-on={!copied || undefined}>Copy</span>
          <span className="swap" data-on={copied || undefined}>Copied</span>
        </button>
        <span role="status" className="sr-only">{copied ? "Email address copied" : ""}</span>
      </div>
      <p className="mt-6 text-lg">
        Or find me on <a href={site.linkedin} className="font-semibold underline hover:text-stamp">LinkedIn</a>.
      </p>
    </section>
  );
}
