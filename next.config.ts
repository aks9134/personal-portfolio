import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `npm run media` already writes web-sized, content-hashed WebP. Next's runtime optimizer only re-encoded
  // them, and under `next start` a request the browser aborted mid-optimization wedged that image size
  // until restart (DECISIONS-LOG 2026-09-21).
  // ponytail: one width per image; have the pipeline write phone widths if Lighthouse mobile LCP fails.
  images: { unoptimized: true },
};

// Project text lives in content/work/<slug>/index.mdx and is imported as modules, not as routes.
export default createMDX({})(nextConfig);
