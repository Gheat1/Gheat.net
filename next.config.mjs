/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // lets CI/verification builds use their own output dir so they don't
  // collide with a running `next dev` (which owns .next)
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
