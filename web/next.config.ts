import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // The source art is PNG (18 MB across public/products alone). AVIF is
    // typically ~30% smaller than the WebP that Next serves by default; the
    // browser picks whichever it supports via content negotiation.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
