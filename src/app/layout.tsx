import type { Metadata, Viewport } from "next";
import { Azeret_Mono, Big_Shoulders, Schibsted_Grotesk } from "next/font/google";
import { Header } from "@/components/header";
import { Palette, type PaletteItem } from "@/components/palette";
import { SiteFooter } from "@/components/site-footer";
import { preview } from "@/lib/og";
import { site } from "@/lib/site";
import { allWork } from "@/lib/work";
import "./globals.css";

// Display: condensed industrial capitals. Text: a sturdy grotesk for reading. Mono: readouts and measurements only.
// next/font downloads them at build time and serves them from this site (no requests to Google at runtime).
const shoulders = Big_Shoulders({ subsets: ["latin"], variable: "--font-shoulders", axes: ["opsz"], display: "swap" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });
const azeret = Azeret_Mono({ subsets: ["latin"], variable: "--font-azeret", display: "swap" });

// Link previews need absolute URLs. `site.url` is the canonical address; NEXT_PUBLIC_SITE_URL overrides it for a build.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? site.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name}, ${site.role.toLowerCase()}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: preview(`${site.name}, ${site.role.toLowerCase()}`, site.description),
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#141210" };

// Saved switches (lights, motion, sound) go onto <html> before the first paint, so nothing flashes or moves first.
// The phone's browser chrome follows the lights too.
const prefs = `try{for(const k of["theme","motion","sound"]){const v=localStorage.getItem("pref-"+k);if(v)document.documentElement.dataset[k]=v}}catch(e){}
var tc=function(){var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=document.documentElement.dataset.theme==="light"?"#efece4":"#141210"};
document.addEventListener("DOMContentLoaded",tc);new MutationObserver(tc).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const work = await allWork();
  const items: PaletteItem[] = [
    { label: "Home", hint: "Page", href: "/" },
    ...work.map((w) => ({ label: w.title, hint: `${w.context}, ${w.year}`, href: `/work/${w.slug}` })),
    { label: "About", hint: "Page", href: "/about" },
    { label: "Resume", hint: "Page", href: "/resume" },
    { label: "Resume PDF", hint: "Download", href: "/allen-sun-resume.pdf" },
    { label: "Take the drive apart", hint: "Home", href: "/#terrament" },
    { label: "Copy email address", hint: site.email, action: "copy-email" },
    { label: "LinkedIn", hint: "Elsewhere", href: site.linkedin },
    { label: "Lights", hint: "Switch", action: "lights" },
    { label: "Motion", hint: "Switch", action: "motion" },
    { label: "Sound", hint: "Switch", action: "sound" },
    { label: "Privacy and accessibility", hint: "Page", href: "/privacy" },
  ];
  return (
    <html lang="en" className={`${shoulders.variable} ${schibsted.variable} ${azeret.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefs }} />
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">
          Skip to content
        </a>
        <Header />
        {children}
        <SiteFooter />
        <Palette items={items} email={site.email} />
      </body>
    </html>
  );
}
