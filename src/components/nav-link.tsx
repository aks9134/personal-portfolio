"use client";

import { usePathname } from "next/navigation";
import { sound } from "@/lib/sound";
import { Scramble } from "./scramble";

// A header link that says which page you're on (aria-current plus amber), decodes on hover, and ticks when sound is on.
export function NavLink({ href, children }: { href: string; children: string }) {
  const here = usePathname() === href;
  return (
    <a
      href={href}
      aria-current={here ? "page" : undefined}
      onPointerEnter={sound.tick}
      className={`readout inline-flex min-h-6 items-center transition-colors duration-150 max-[400px]:tracking-normal ${here ? "text-accent" : "text-fg hover:text-accent"}`}
    >
      <Scramble text={children} />
    </a>
  );
}
