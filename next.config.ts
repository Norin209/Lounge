/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // Netlify's Next.js adapter serves responsive images through its Image CDN.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/glistenlounge-f217f.firebasestorage.app/o/**",
      },
    ],
  },
};

export default nextConfig;
