"use client";

import { usePathname } from "next/navigation";

// A nav link that says which page you're on: aria-current for screen readers, an underline for everyone else.
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const here = usePathname() === href;
  return (
    <a href={href} aria-current={here ? "page" : undefined} className={here ? "underline" : "hover:underline"}>
      {children}
    </a>
  );
}
