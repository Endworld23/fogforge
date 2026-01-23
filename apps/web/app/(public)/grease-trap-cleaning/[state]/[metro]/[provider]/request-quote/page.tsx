import { notFound } from "next/navigation";
import { Badge } from "../../../../../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../../../../../../lib/supabase/server";
import QuoteRequestForm from "../../../../../../request-quote/QuoteRequestForm";

type ProviderQuoteRouteProps = {
  params: Promise<{ state: string; metro: string; provider: string }>;
};

export default async function ProviderRequestQuotePage({ params }: ProviderQuoteRouteProps) {
  const resolvedParams = await params;
  const supabase = await createServerSupabaseReadOnly();
  const { data: providerData } = await supabase
    .schema("public")
    .from("providers")
    .select("id, business_name, metro_id, category_id, is_published, status")
    .eq("slug", resolvedParams.provider)
    .eq("is_published", true)
    .eq("status", "active")
    .maybeSingle();

  if (!providerData) {
    notFound();
  }

  const [{ data: metroData }, { data: categoryData }, { data: metrosData }] = await Promise.all([
    supabase
      .schema("public")
      .from("metros")
      .select("id, name, slug, state")
      .eq("id", providerData.metro_id)
      .maybeSingle(),
    supabase
      .schema("public")
      .from("categories")
      .select("id, slug, name")
      .eq("id", providerData.category_id)
      .maybeSingle(),
    supabase
      .schema("public")
      .from("metros")
      .select("id, name, slug, state")
      .order("name", { ascending: true }),
  ]);

  if (!metroData || !categoryData || categoryData.slug !== "grease-trap-cleaning") {
    notFound();
  }

  if (metroData.slug !== resolvedParams.metro) {
    notFound();
  }

  if (metroData.state.toLowerCase() !== resolvedParams.state.toLowerCase()) {
    notFound();
  }

  const metros = (metrosData ?? []).map((metro) => ({
    id: metro.id,
    name: metro.name,
    slug: metro.slug,
    state: metro.state,
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <Badge className="w-fit" variant="secondary">
          {metroData.name}, {metroData.state}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Request a quote from {providerData.business_name}.
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          We’ll send your request directly to this provider.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Quote request details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteRequestForm
            metros={metros}
            categoryId={categoryData.id}
            initialMetroId={metroData.id}
            initialState={metroData.state}
            provider={{
              id: providerData.id,
              business_name: providerData.business_name ?? "Provider",
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
