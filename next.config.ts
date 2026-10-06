import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: For self-hosting with `bun .next/standalone/server.js`, set this to "standalone"
  // and run `npm run build:standalone` instead of `npm run build`.
  // Vercel doesn't need standalone mode — it handles Next.js natively.
  // output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Required for Vercel — the @prisma/client generated code lives in node_modules
  // and needs to be bundled into serverless functions.
  serverExternalPackages: ["@prisma/client", "@node-rs/argon2"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
