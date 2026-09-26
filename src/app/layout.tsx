import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import { ScrollRail } from "@/components/scroll-rail";
import { SiteFooter } from "@/components/site-footer";
import { preview } from "@/lib/og";
import { site } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
// Figures and readouts only (the explode readout, spec figures): a mono with its own width axis, like Archivo's.
// Not preloaded: nothing on the first screen uses it.
const mono = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap", preload: false });

// Link previews need absolute URLs, so the site has to know its own address. `site.url` is the canonical one
// (Vercel hands a project several), and NEXT_PUBLIC_SITE_URL overrides it for a one-off build.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? site.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name}, ${site.role.toLowerCase()}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: preview(`${site.name}, ${site.role.toLowerCase()}`, site.description),
  twitter: { card: "summary_large_image" },
};

// Phone status bar and browser chrome take the page color in each scheme (the stock, or the night sheet).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4e3a8" },
    { media: "(prefers-color-scheme: dark)", color: "#19160e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${mono.variable}`}>
      <head>
        <script
          // Applies the saved sheet before paint, so a night reader never gets a flash of day.
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem("sheet");if(s)document.documentElement.dataset.theme=s}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-10 focus:bg-ink focus:px-4 focus:py-2 focus:text-stock"
        >
          Skip to content
        </a>
        <ScrollRail />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
