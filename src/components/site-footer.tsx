import type { ReactNode } from "react";
import { site } from "@/lib/site";

// The footer is the sheet's title block: the ruled box in a drawing's corner that says whose it is and where to
// send questions. Every cell holds a real link or the employer disclaimer; nothing in it is decoration.
function Cell({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`border-ink p-3 ${className}`}>
      <p className="text-xs font-bold text-ink-2">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const link = "font-semibold underline hover:text-stamp";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-28 max-w-[1400px] px-4 pb-10 md:px-10">
      <div className="grid border-[1.5px] border-ink text-sm sm:grid-cols-2 lg:ml-auto lg:max-w-[52rem] lg:grid-cols-[1.4fr_1fr_1fr]">
        <Cell label="Sheet" className="border-b-[1.5px] sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:border-b-0 lg:border-r-[1.5px]">
          <p className="text-2xl font-extrabold leading-tight tracking-[-0.02em] [font-stretch:112%]">{site.name}</p>
          <p className="mt-1 text-ink-2">{site.role}</p>
        </Cell>
        <Cell label="Email" className="border-b sm:border-r lg:border-r">
          <a href={`mailto:${site.email}`} className={link}>{site.email}</a>
        </Cell>
        <Cell label="Elsewhere" className="border-b">
          <a href={site.linkedin} className={link}>LinkedIn</a>
        </Cell>
        <Cell label="Resume" className="border-b sm:border-b-0 sm:border-r lg:border-r">
          <a href="/allen-sun-resume.pdf" download className={link}>PDF, one page</a>
        </Cell>
        <Cell label="Privacy" className="">
          <a href="/privacy" className={link}>Privacy and accessibility</a>
        </Cell>
        <p className="border-t-[1.5px] border-ink p-3 text-ink-2 sm:col-span-2 lg:col-span-3">
          Views are my own and don&apos;t represent any employer.
        </p>
      </div>
    </footer>
  );
}
