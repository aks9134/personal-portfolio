"use client";
import { useEffect, useState } from "react";

type Section = { id: string; text: string };

// A case study's sheet index. Once the title has scrolled away, a thin bar pins to the top of the window with the
// project name, its sections as jump links (the one being read is marked), and a dimension line along the bottom
// edge that fills as the page is read. Hidden bars are inert, so keyboard focus never lands on them.
export function SheetBar({ title }: { title: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const heads = [...document.querySelectorAll<HTMLHeadingElement>("#main article h2[id]")];
    setSections(heads.map((h) => ({ id: h.id, text: h.textContent ?? "" })));

    const h1 = document.querySelector("#main h1");
    const pin = new IntersectionObserver(([e]) => setShown(!e.isIntersecting && e.boundingClientRect.top < 0));
    if (h1) pin.observe(h1);

    // The section being read is the last heading above the reading line, or the last one once the page bottoms
    // out (a short final section never reaches the line). Recomputed once per frame while scrolling, so End,
    // a scrollbar drag or a find-in-page jump can't leave it stale.
    let frame = 0;
    const read = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const passed = heads.filter((h) => h.getBoundingClientRect().top < line);
      setActive((atEnd && passed.length ? heads.at(-1) : passed.at(-1))?.id ?? null);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      pin.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (sections.length < 3) return null;

  return (
    <nav aria-label="Case study sections" inert={!shown} data-shown={shown || undefined} className="sheet-bar print:hidden">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 md:px-10">
        <a href="#main" className="min-w-0 truncate py-2.5 lg:shrink-0 font-extrabold tracking-[-0.01em] [font-stretch:110%] hover:text-stamp">
          {title}
        </a>
        <ol className="ml-auto hidden gap-5 text-sm lg:flex">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined} className="sheet-link py-2.5">
                {s.text}
              </a>
            </li>
          ))}
        </ol>
        <span aria-hidden className="ml-auto truncate text-sm text-ink-2 lg:hidden">
          {sections.find((s) => s.id === active)?.text}
        </span>
      </div>
      <span aria-hidden className="sheet-progress" />
    </nav>
  );
}
