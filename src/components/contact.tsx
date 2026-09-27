"use client";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { sound } from "@/lib/sound";

// The one action, set large. The address is a mailto link; Copy is for browsers with no mail app wired up, and it
// says so on screen and to screen readers when it has worked.
export function Contact() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      sound.clunk();
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the mailto link still works.
    }
  };

  return (
    <section aria-labelledby="contact-title" className="pt-12">
      <h2 id="contact-title" className="max-w-[30ch] text-xl leading-snug text-muted md:text-2xl">
        Want to talk about any of this?
      </h2>
      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-4">
        <a href={`mailto:${site.email}`} onPointerEnter={sound.tick} className="display text-[clamp(2.75rem,9vw,8rem)] transition-colors duration-150 hover:text-accent">
          {site.email}
        </a>
        <button type="button" onClick={copy} className="btn mb-2">
          {copied ? "Copied" : "Copy"}
        </button>
        <span role="status" className="sr-only">{copied ? "Email address copied" : ""}</span>
      </div>
    </section>
  );
}
