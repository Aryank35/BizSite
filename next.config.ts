import type { NextConfig } from "next";

/** Allow next/image to optimise images served from the S3 public URL, when configured. */
function s3ImagePattern() {
  const publicUrl = process.env.S3_PUBLIC_URL;
  if (!publicUrl) return [];
  const url = new URL(publicUrl);
  return [{ protocol: url.protocol.replace(":", "") as "https" | "http", hostname: url.hostname, pathname: `${url.pathname.replace(/\/$/, "")}/**` }];
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    localPatterns: [{ pathname: "/media/**", search: "" }],
    remotePatterns: s3ImagePattern(),
    qualities: [75],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Private areas must never be indexed.
      {
        source: "/(admin|dashboard|preview|invite|login)(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
