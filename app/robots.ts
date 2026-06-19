import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? "https://emergepet.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow:     ["/", "/signup", "/login", "/forgot-password"],
        disallow:  ["/admin/", "/api/", "/dashboard/", "/setup/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
