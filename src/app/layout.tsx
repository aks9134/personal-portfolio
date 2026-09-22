import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import Link from "next/link";
import og from "@/lib/og.generated.json";
import { site } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${site.name}, ${site.role.toLowerCase()}`, template: `%s | ${site.name}` },
  description: site.description,
  // Link previews (npm run og). Pages without their own inherit these.
  openGraph: { type: "website", siteName: site.name, title: `${site.name}, ${site.role.toLowerCase()}`, description: site.description, images: [{ url: og.home, width: 1200, height: 630, alt: "Exploded view of the micro-vibration canceller" }] },
  twitter: { card: "summary_large_image" },
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
            <p>{site.name}. Views and work shown are my own and do not represent my employer.</p>
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
