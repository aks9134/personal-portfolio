import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// Project text lives in content/work/<slug>/index.mdx and is imported as modules, not as routes.
export default createMDX({})(nextConfig);
