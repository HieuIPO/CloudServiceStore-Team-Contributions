import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker-hosted dev server receives the HMR request from the bridge
  // gateway. Allow the local development origins so Turbopack can keep the
  // client build in sync instead of leaving the page in a stale state.
  allowedDevOrigins: [
    "localhost:3000",
    "localhost:3001",
    "localhost:3002",
    "127.0.0.1:3000",
    "127.0.0.1:3001",
    "127.0.0.1:3002",
    "172.18.128.1"
  ]
};

export default nextConfig;
