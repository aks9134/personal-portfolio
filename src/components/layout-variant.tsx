"use client";

import { useEffect } from "react";

// Trial layouts for the project write-up (case-body.tsx): ?layout=side or ?layout=heads on a project page sets
// html[data-layout], and the choice follows from page to page in this tab; ?layout=default clears it. Temporary,
// until Allen picks one.
const KEY = "lcc-layout";
export function LayoutVariant() {
  useEffect(() => {
    const html = document.documentElement;
    let v = new URLSearchParams(location.search).get("layout");
    try {
      if (v) sessionStorage.setItem(KEY, v);
      else v = sessionStorage.getItem(KEY);
    } catch {
      // storage blocked: the parameter alone still works on this page
    }
    if (v === "side" || v === "heads") html.dataset.layout = v;
    return () => {
      delete html.dataset.layout;
    };
  }, []);
  return null;
}
