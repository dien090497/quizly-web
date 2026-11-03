/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep production builds separate so running `next build` cannot corrupt a live dev server.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
};
export default nextConfig;
