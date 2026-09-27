"use client";

import { useEffect, useState } from "react";

// The case study's sections as a sticky list beside the text on wide screens, with the one you're reading lit amber
// and a depth readout (how far through the write-up you are). The sections come from the write-up at build time.
export function SectionIndex({ within, sections }: { within: string; sections: { id: string; text: string }[] }) {
  const [at, setAt] = useState<string | null>(null);
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    const root = document.querySelector(within);
    if (!root) return;
    const io = new IntersectionObserver(
      (es) => {
        const shown = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (shown[0]) setAt(shown[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    sections.forEach((s) => {
      const h = document.getElementById(s.id);
      if (h) io.observe(h);
    });
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = root.getBoundingClientRect();
        setDepth(Math.round(Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight))) * 100));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [within, sections]);

  if (!sections.length) return null;
  return (
    <nav aria-label="Sections" className="sticky top-24">
      <p className="readout text-muted">
        Read <span className="val">{String(depth).padStart(3, "0")} %</span>
      </p>
      <ol className="mt-4 border-l border-rule">
        {sections.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={at === h.id ? "location" : undefined}
              className={`-ml-px block border-l py-1.5 pl-4 text-sm leading-snug transition-colors duration-150 ${at === h.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-fg"}`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
