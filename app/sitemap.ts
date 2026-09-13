import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return [
    { url: appUrl, lastModified: new Date(), priority: 1 },
    { url: `${appUrl}/sign-up`, lastModified: new Date(), priority: 0.8 },
    { url: `${appUrl}/sign-in`, lastModified: new Date(), priority: 0.6 },
    { url: `${appUrl}/terms`, lastModified: new Date(), priority: 0.3 },
    { url: `${appUrl}/privacy`, lastModified: new Date(), priority: 0.3 },
  ];
}
