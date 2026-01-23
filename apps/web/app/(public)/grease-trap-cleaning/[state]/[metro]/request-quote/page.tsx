import { notFound } from "next/navigation";
import { Badge } from "../../../../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../../../../../lib/supabase/server";
import QuoteRequestForm from "../../../../../request-quote/QuoteRequestForm";

type MetroRouteProps = {
  params: Promise<{ state: string; metro: string }>;
};

export default async function MetroRequestQuotePage({ params }: MetroRouteProps) {
  const resolvedParams = await params;
  const supabase = await createServerSupabaseReadOnly();
  const [{ data: metroData }, { data: categoryData }, { data: metrosData }] = await Promise.all([
    supabase
      .schema("public")
      .from("metros")
      .select("id, name, slug, state")
      .eq("slug", resolvedParams.metro)
      .maybeSingle(),
    supabase.schema("public").from("categories").select("id").eq("slug", "grease-trap-cleaning").maybeSingle(),
    supabase
      .schema("public")
      .from("metros")
      .select("id, name, slug, state")
      .order("name", { ascending: true }),
  ]);

  if (!metroData || !categoryData?.id) {
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
          Request grease trap cleaning in {metroData.name}.
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          We’ll route your request to providers serving {metroData.name}.
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
          />
        </CardContent>
      </Card>
    </main>
  );
}
