import Link from "next/link";
import { site } from "@/lib/site";
import { NavLink } from "./nav-link";

// Header nav and the compact header used on project pages. The home page sets its own large name.
export function SiteNav() {
  return (
    <nav aria-label="Primary" className="flex flex-wrap gap-x-4 gap-y-1 text-base font-semibold [font-stretch:106%] sm:gap-x-6">
      <Link href="/#work" className="hover:underline">Work</Link>
      <NavLink href="/about">About</NavLink>
      <NavLink href="/resume">Resume</NavLink>
      <a href={`mailto:${site.email}`} className="hover:underline">Email</a>
      <a href={site.linkedin} className="hover:underline">LinkedIn</a>
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-[1400px] flex-wrap items-baseline justify-between gap-4 px-4 pt-6 md:px-10">
      <Link href="/" className="text-2xl font-extrabold tracking-[-0.02em] [font-stretch:112%]">
        {site.name}
      </Link>
      <SiteNav />
    </header>
  );
}
