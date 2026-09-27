import { site } from "@/lib/site";
import { Contact } from "./contact";
import { Switches } from "./controls";
import { PaletteButton } from "./palette";
import { Waveform } from "./waveform";

// End of every page: the one action (email), the other ways to reach Allen, the bay's switches (the only place they
// live on phones), and the employer line. The waveform across the top answers how fast the page is being scrolled.
export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-rule print:hidden">
      <Waveform className="h-16 w-full" />
      <div className="mx-auto max-w-[1600px] px-4 pb-10 md:px-8">
        <Contact />
        <div className="mt-16 grid gap-6 border-t border-rule pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <p>
            <a href={site.linkedin} className="link">LinkedIn</a>
          </p>
          <p>
            <a href="/allen-sun-resume.pdf" download className="link">Resume PDF, one page</a>
          </p>
          <p>
            <a href="/privacy" className="link">Privacy and accessibility</a>
          </p>
          <div className="flex flex-wrap items-center gap-4 lg:justify-end">
            <Switches />
            <PaletteButton />
          </div>
        </div>
        <p className="mt-8 text-sm text-muted">Views are my own and don&apos;t represent any employer.</p>
      </div>
    </footer>
  );
}
