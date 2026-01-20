const LOCAL_URL = "http://localhost:3000";

export function getSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const baseUrl =
    explicitUrl ||
    (vercelUrl ? `https://${vercelUrl}` : "") ||
    LOCAL_URL;

  return baseUrl.replace(/\/$/, "");
}
