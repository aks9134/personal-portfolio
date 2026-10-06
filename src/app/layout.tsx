import type { Metadata, Viewport } from "next";
import { Martian_Mono, Schibsted_Grotesk } from "next/font/google";
import { ConsoleFooter } from "@/components/console-footer";
import { Palette, type PaletteItem } from "@/components/palette";
import { preview } from "@/lib/og";
import { site } from "@/lib/site";
import { allWork } from "@/lib/work";
import "./globals.css";
import "./console.css";

// v5, Console: Martian Mono (its width axis gives the wide instrument capitals) for labels, readouts and headings, and
// a sturdy grotesk for reading. next/font serves both from this site (no requests to Google at runtime).
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--lc-mono", display: "swap" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });

// Link previews need absolute URLs. `site.url` is the canonical address; NEXT_PUBLIC_SITE_URL overrides it for a build.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? site.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name}, ${site.role.toLowerCase()}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: preview(`${site.name}, ${site.role.toLowerCase()}`, site.description),
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#05070a" };

// Saved switches (motion, sound) go onto <html> before the first paint, so nothing moves first. (v4's saved Lights
// choice is ignored: v5 is dark only.)
const prefs = `try{for(const k of["motion","sound"]){const v=localStorage.getItem("pref-"+k);if(v)document.documentElement.dataset[k]=v}}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const work = await allWork();
  const items: PaletteItem[] = [
    { label: "Home", hint: "Page", href: "/" },
    ...work.map((w) => ({ label: w.title, hint: `${w.context}, ${w.year}`, href: `/work/${w.slug}` })),
    { label: "About", hint: "Page", href: "/about" },
    { label: "Resume", hint: "Page", href: "/resume" },
    { label: "Resume PDF", hint: "Download", href: "/allen-sun-resume.pdf" },
    { label: "Copy email address", hint: site.email, action: "copy-email" },
    { label: "LinkedIn", hint: "Elsewhere", href: site.linkedin },
    { label: "Motion", hint: "Switch", action: "motion" },
    { label: "Sound", hint: "Switch", action: "sound" },
    { label: "Privacy and accessibility", hint: "Page", href: "/privacy" },
  ];
  return (
    <html lang="en" className={`${martian.variable} ${schibsted.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefs }} />
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">
          Skip to content
        </a>
        {children}
        <ConsoleFooter />
        <Palette items={items} email={site.email} />
      </body>
    </html>
  );
}
