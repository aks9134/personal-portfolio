"use client";

import { useEffect, useRef, useState } from "react";
import { sectionProgress } from "../progress";

export type Chapter = {
  code: string;
  name: string;
  meta: string;
  seq?: string; // /lab/teardown/<name>, rendered offline from the CAD
  statement: [string, string]; // two lines that land once the object has turned
  spec: string; // a run-on spec paragraph
  photos: { src: string; alt: string; w: number; h: number }[];
  href: string;
};

// Plays a pre-rendered sequence on a canvas by scroll position (the product-page flip-book). Frames load in order;
// until a frame has arrived the nearest loaded one is drawn.
function Sequence({ seq, onProgress }: { seq: string; onProgress: (p: number) => void }) {
  const run = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    const imgs: HTMLImageElement[] = [];
    let n = 0;
    let drawn = -1;
    const draw = () => {
      const c = canvas.current;
      if (!c || !n || !run.current) return;
      const p = sectionProgress(run.current);
      onProgress(p);
      let i = Math.round(p * (n - 1));
      while (i > 0 && !imgs[i]?.complete) i--;
      if (i === drawn || !imgs[i]?.complete) return;
      drawn = i;
      const g = c.getContext("2d")!;
      const W = (c.width = c.clientWidth * Math.min(2, devicePixelRatio));
      const H = (c.height = c.clientHeight * Math.min(2, devicePixelRatio));
      const img = imgs[i];
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      g.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    };
    (async () => {
      const m = await fetch(`${seq}/manifest.json`).then((r) => r.json());
      if (!alive) return;
      n = m.frames;
      for (let k = 0; k < n; k++) {
        const img = new Image();
        img.decoding = "async";
        img.src = `${seq}/${String(k).padStart(3, "0")}.webp`;
        img.onload = () => {
          drawn = -1;
          draw();
        };
        imgs.push(img);
      }
    })();
    const on = () => requestAnimationFrame(() => {
      drawn = -1;
      draw();
    });
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      alive = false;
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [seq, onProgress]);
  return (
    <div ref={run} className="lt-run">
      <div className="lt-pin">
        <canvas ref={canvas} className="lt-canvas" />
      </div>
    </div>
  );
}

function ChapterView({ c, first }: { c: Chapter; first: boolean }) {
  const [p, setP] = useState(0);
  return (
    <section className="lt-chapter" id={`c${c.code}`}>
      {c.seq ? (
        <div className="relative">
          <Sequence seq={c.seq} onProgress={setP} />
          <div className="lt-over">
            <p className="lt-mono">
              {c.code} / {c.name}
            </p>
            {first && (
              <p className={`lt-hello ${p < 0.18 ? "is-on" : ""}`}>
                Allen Sun designs parts, machines them, and puts them on a test rig.
              </p>
            )}
            <h2 className={`lt-statement ${p > 0.55 ? "is-on" : ""}`}>
              <span>{c.statement[0]}</span>
              <span>{c.statement[1]}</span>
            </h2>
          </div>
        </div>
      ) : (
        <div className="lt-head">
          <p className="lt-mono">
            {c.code} / {c.name}
          </p>
          <h2 className="lt-statement is-on lt-static">
            <span>{c.statement[0]}</span>
            <span>{c.statement[1]}</span>
          </h2>
        </div>
      )}
      <div className="lt-spec">
        <div>
          <h3>{c.name}</h3>
          <p className="lt-mono">{c.meta}</p>
        </div>
        <p className="lt-runon">{c.spec}</p>
        <a className="lt-mono lt-link" href={c.href}>
          Read the case study
        </a>
      </div>
      {c.photos.length > 0 && (
        <div className="lt-photos">
          {c.photos.map((ph) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={ph.src} src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} loading="lazy" />
          ))}
        </div>
      )}
    </section>
  );
}

// Direction C, "Teardown": a bright studio and a launch-film pace. Each chapter is a pre-rendered teardown of the
// real CAD played by scroll, a two-line statement that lands after the object has turned, then a dense spec block
// and the real photographs.
export function Teardown({ chapters, more }: { chapters: Chapter[]; more: { title: string; meta: string; href: string }[] }) {
  return (
    <main className="lab-teardown">
      <header className="lt-top">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="lt-brand">Allen Sun</a>
        <nav className="lt-mono flex gap-5">
          {chapters.map((c) => (
            <a key={c.code} href={`#c${c.code}`}>{c.code}</a>
          ))}
          <a href="/resume">Resume</a>
          <a href="mailto:aks9134@nyu.edu">Email</a>
        </nav>
      </header>
      {chapters.map((c, i) => (
        <ChapterView key={c.code} c={c} first={i === 0} />
      ))}
      <section className="lt-more">
        <p className="lt-mono">Also</p>
        <ul>
          {more.map((m) => (
            <li key={m.href}>
              <a href={m.href}>
                <b>{m.title}</b>
                <span className="lt-mono">{m.meta}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="lt-big">aks9134@nyu.edu</p>
      </section>
    </main>
  );
}
