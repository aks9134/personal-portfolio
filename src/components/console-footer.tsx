import { site } from "@/lib/site";
import { Contact } from "./contact";
import { Switches } from "./controls";
import { PaletteButton } from "./palette";

// End of every page: the one action (email), the other ways to reach Allen, the page switches (Motion, Sound) and the
// jump menu, and the employer line. Never printed.
export function ConsoleFooter() {
  return (
    <footer className="lc-foot print:hidden">
      <Contact />
      <div className="lc-foot-row">
        <a href={site.linkedin}>LinkedIn</a>
        <a href="/allen-sun-resume.pdf" download>Resume PDF, one page</a>
        <a href="/about">About</a>
        <a href="/privacy">Privacy and accessibility</a>
        <div className="lc-foot-switches">
          <Switches />
          <PaletteButton />
        </div>
      </div>
      <p className="lc-dim lc-foot-note">Views are my own and don&apos;t represent any employer.</p>
    </footer>
  );
}
