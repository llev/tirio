/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This is a JS -> TSX port with no hand-written type annotations; skip the
  // type-checking pass at build time (tsconfig also runs strict: false).
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
