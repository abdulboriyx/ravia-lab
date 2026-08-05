import type { NextConfig } from "next";

const molstarMp4Stub = "./app/code/spatial-ravia/molstar-h264-stub.ts";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"]
  },
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      "h264-mp4-encoder": molstarMp4Stub
    }
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "h264-mp4-encoder": molstarMp4Stub
    };
    return config;
  }
};

export default nextConfig;
