import type { NextConfig } from "next";
const config: NextConfig = { devIndicators: false, distDir: process.env.PLAYWRIGHT_ISOLATED === "1" ? ".next-e2e" : ".next" };
export default config;
