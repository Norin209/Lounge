/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Crucial for Netlify/local dev without a Sharp server
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;