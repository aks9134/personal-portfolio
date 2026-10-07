"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sound } from "@/lib/sound";
import { togglePref } from "@/lib/prefs";

export type PaletteItem = { label: string; hint: string; href?: string; action?: "motion" | "sound" | "copy-email" };

// Ctrl/Cmd-K jumps anywhere: pages, every project, and the bay's switches. A native modal <dialog> (focus trap,
// Escape, inert page for free). No open or close animation: it is a keyboard tool, used fast and often.
export function Palette({ items, email }: { items: PaletteItem[]; email: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(s)) : items;
  }, [q, items]);

  useEffect(() => {
    const open = () => {
      setQ("");
      setAt(0);
      dialog.current?.showModal();
      input.current?.focus();
    };
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    };
    window.addEventListener("keydown", key);
    window.addEventListener("palette:open", open);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("palette:open", open);
    };
  }, []);

  const run = (i: PaletteItem) => {
    sound.clunk();
    dialog.current?.close();
    if (i.href) {
      window.location.href = i.href;
      return;
    }
    if (i.action === "motion") togglePref("motion");
    if (i.action === "sound") togglePref("sound");
    if (i.action === "copy-email") void navigator.clipboard?.writeText(email).catch(() => {});
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAt((a) => Math.min(shown.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAt((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && shown[at]) {
      e.preventDefault();
      run(shown[at]);
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-label="Jump to"
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      className="m-0 mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] border border-rule-strong bg-bg-2 p-0 text-fg backdrop:bg-[rgba(2,3,5,0.75)]"
    >
      <div className="flex items-center gap-3 border-b border-rule px-4">
        <label htmlFor="palette-q" className="readout text-muted">Jump to</label>
        <input
          ref={input}
          id="palette-q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAt(0);
          }}
          onKeyDown={onKey}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={shown[at] ? `palette-${at}` : undefined}
          autoComplete="off"
          spellCheck={false}
          className="h-14 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
          placeholder="A project, a page, or a switch"
        />
        <kbd className="readout text-muted">Esc</kbd>
      </div>
      <ul id="palette-list" role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto py-2">
        {shown.map((i, n) => (
          <li
            key={i.label}
            id={`palette-${n}`}
            role="option"
            aria-selected={n === at}
            onMouseEnter={() => setAt(n)}
            onClick={() => run(i)}
            className={`flex cursor-pointer items-baseline justify-between gap-4 px-4 py-2.5 ${n === at ? "bg-bg-3 text-accent" : ""}`}
          >
            <span className="text-base">{i.label}</span>
            <span className="readout text-muted">{i.hint}</span>
          </li>
        ))}
        {!shown.length && <li className="px-4 py-3 text-muted">Nothing matches &ldquo;{q}&rdquo;. Try a project name, &ldquo;resume&rdquo; or &ldquo;sound&rdquo;.</li>}
      </ul>
    </dialog>
  );
}

export function PaletteButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("palette:open"))}
      aria-keyshortcuts="Control+K Meta+K"
      className="readout-btn gap-2 border border-rule-strong px-2 py-1"
    >
      Jump to <kbd className="palette-key text-fg">Ctrl K</kbd>
    </button>
  );
}
