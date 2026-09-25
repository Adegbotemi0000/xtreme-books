import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Without this, Turbopack walks up from this project and finds an
  // unrelated package-lock.json in the parent user folder (a sibling
  // project's, not this repo's), misidentifying it as a monorepo root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
