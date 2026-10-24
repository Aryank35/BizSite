import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/preview", "/invite", "/login", "/api", "/auth"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
