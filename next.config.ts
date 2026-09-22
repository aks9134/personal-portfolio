import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No runtime optimizer: under `next start` a request the browser aborted mid-optimization wedged that image
  // size until restart (DECISIONS-LOG 2026-09-21). `npm run media` writes content-hashed WebP plus 640/828/1200 px
  // copies, and pages list them in a truthful srcset with plain <img> (src/lib/image-widths.ts). This stays as a
  // safety net if next/image is ever used again; the smoke test fails on any /_next/image request.
  images: { unoptimized: true },
  // CSS arrives inside the HTML instead of as a render-blocking file: Tailwind keeps it small, and most visitors
  // are first-timers from a resume link (Next.js inlineCss guide; experimental, measured with Lighthouse).
  experimental: { inlineCss: true },
  // Security headers (framework Phase 7, Next.js CSP guide "without nonces", which keeps pages static).
  // Everything loads from this site. 'unsafe-inline' covers Next's inline bootstrap scripts and style attributes;
  // 'wasm-unsafe-eval' is the 3D viewer's meshopt decoder (WebAssembly). Retest the viewers after any change here.
  async headers() {
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:",
      "media-src 'self'",
      "font-src 'self'",
      "connect-src 'self' blob: data:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
};

// Project text lives in content/work/<slug>/index.mdx and is imported as modules, not as routes.
export default createMDX({})(nextConfig);
