import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";

type MetroRow = {
  id: string;
  name: string;
  slug: string;
  state: string;
};

export default async function GreaseTrapCleaningPage() {
  const supabase = createServerSupabaseReadOnly();
  const { data, error } = await supabase
    .schema("public")
    .from("metros")
    .select("id, name, slug, state")
    .order("name", { ascending: true });

  const metros = (data ?? []) as MetroRow[];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <Badge className="w-fit" variant="secondary">
          Directory
        </Badge>
        <h1>Grease Trap Cleaning</h1>
        <p>Choose a metro area to see local providers.</p>
      </header>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Unable to load metros right now.
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metros.map((metro) => (
          <Card key={metro.id}>
            <CardHeader>
              <CardTitle>{metro.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <Link
                className="text-primary underline-offset-4 hover:underline"
                href={`/grease-trap-cleaning/${metro.state.toLowerCase()}/${metro.slug}`}
              >
                View providers in {metro.state}
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
