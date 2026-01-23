import { notFound } from "next/navigation";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../lib/supabase/server";
import QuoteRequestForm from "./QuoteRequestForm";

type MetroRow = {
  id: string;
  name: string;
  slug: string;
  state: string;
};

export default async function RequestQuotePage() {
  const supabase = await createServerSupabaseReadOnly();
  const [{ data: metrosData }, { data: categoryData }] = await Promise.all([
    supabase
      .schema("public")
      .from("metros")
      .select("id, name, slug, state")
      .order("name", { ascending: true }),
    supabase.schema("public").from("categories").select("id").eq("slug", "grease-trap-cleaning").maybeSingle(),
  ]);

  if (!categoryData?.id) {
    notFound();
  }

  const metros: MetroRow[] = (metrosData ?? []).map((metro) => ({
    id: metro.id,
    name: metro.name,
    slug: metro.slug,
    state: metro.state,
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <Badge className="w-fit" variant="secondary">
          Request a Quote
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Tell us what you need, and we’ll match you with local cleaners.
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Share your metro and details once. We’ll route your request to the right team.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Quote request details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteRequestForm metros={metros} categoryId={categoryData.id} />
        </CardContent>
      </Card>
    </main>
  );
}
