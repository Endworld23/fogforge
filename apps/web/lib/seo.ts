const LOCAL_URL = "http://localhost:3000";

export function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    return siteUrl.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV !== "production") {
    return LOCAL_URL;
  }
  return "";
}
