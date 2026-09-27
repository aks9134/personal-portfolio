import { site } from "@/lib/site";
import { Switches } from "./controls";
import { NavLink } from "./nav-link";
import { PaletteButton } from "./palette";

// One header for every page: the name (home), four destinations, and on wide screens the bay's switches plus the
// command palette key. Solid background, no blur: it sits over the page, not over a photo.
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-bg print:hidden">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 md:px-8">
        <a href="/" className="readout inline-flex min-h-6 items-center whitespace-nowrap text-fg max-[400px]:tracking-normal">
          {site.name}
        </a>
        <nav aria-label="Primary" className="flex items-center gap-3 sm:gap-6">
          <NavLink href="/#work">Work</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/resume">Resume</NavLink>
          <NavLink href={`mailto:${site.email}`}>Email</NavLink>
        </nav>
        <div className="hidden items-center gap-5 lg:flex">
          <Switches />
          <PaletteButton />
        </div>
      </div>
    </header>
  );
}
