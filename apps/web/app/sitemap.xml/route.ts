import { NextResponse } from "next/server";
import { createServerSupabaseReadOnly } from "../../lib/supabase/server";
import { getSiteUrl } from "../../lib/seo";

export const runtime = "nodejs";

function buildUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path}`;
}

export async function GET() {
  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return new NextResponse("", {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }

  const supabase = await createServerSupabaseReadOnly();
  const [{ data: metros }, { data: providers }] = await Promise.all([
    supabase.schema("public").from("metros").select("slug, state"),
    supabase
      .schema("public")
      .from("providers")
      .select("slug, metros!inner(slug,state), categories!inner(slug)")
      .eq("categories.slug", "grease-trap-cleaning")
      .eq("is_published", true)
      .eq("status", "active"),
  ]);

  const urls: string[] = [
    buildUrl(siteUrl, "/"),
    buildUrl(siteUrl, "/grease-trap-cleaning"),
  ];

  (metros ?? []).forEach((metro) => {
    urls.push(buildUrl(siteUrl, `/grease-trap-cleaning/${metro.state.toLowerCase()}/${metro.slug}`));
  });

  (providers ?? []).forEach((provider) => {
    const metro = provider.metros?.[0];
    if (!metro) {
      return;
    }
    urls.push(
      buildUrl(
        siteUrl,
        `/grease-trap-cleaning/${metro.state.toLowerCase()}/${metro.slug}/${provider.slug}`
      )
    );
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
