import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/admin/", "/dashboard/", "/api/dashboard/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
