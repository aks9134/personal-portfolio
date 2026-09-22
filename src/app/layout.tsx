import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import Link from "next/link";
import { preview } from "@/lib/og";
import { site } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

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
    <html lang="en" className={archivo.variable}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-10 focus:bg-ink focus:px-4 focus:py-2 focus:text-stock"
        >
          Skip to content
        </a>
        {children}
        <footer className="mx-auto mt-28 max-w-[1400px] px-4 pb-10 md:px-10">
          <div className="flex flex-col gap-3 border-t-[1.5px] border-ink pt-5 text-sm md:flex-row md:justify-between">
            <p>{site.name}. Views are my own and don&apos;t represent any employer.</p>
            <p className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/privacy" className="underline hover:text-stamp">Privacy and accessibility</Link>
              <a href={`mailto:${site.email}`} className="underline hover:text-stamp">{site.email}</a>
              <a href={site.linkedin} className="underline hover:text-stamp">LinkedIn</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
