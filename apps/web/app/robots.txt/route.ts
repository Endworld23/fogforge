import { NextResponse } from "next/server";
import { getSiteUrl } from "../../lib/seo";

export async function GET() {
  const siteUrl = getSiteUrl();
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /login",
  ];

  if (siteUrl) {
    lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
