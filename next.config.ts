import type { NextConfig } from "next";
import path from "node:path";

const molstarMp4Stub = path.resolve(
  process.cwd(),
  "app/code/spatial-ravia/molstar-h264-stub.ts"
);
const molstarMp4StubForTurbopack = "./app/code/spatial-ravia/molstar-h264-stub.ts";

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
      "h264-mp4-encoder": molstarMp4StubForTurbopack
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
