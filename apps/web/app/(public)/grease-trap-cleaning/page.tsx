import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { Skeleton } from "../../../components/ui/skeleton";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { getSiteUrl } from "../../../lib/seo";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Grease Trap Cleaning Providers",
  description:
    "Find trusted grease trap cleaning providers near you. Browse metro listings and connect with local service professionals.",
  alternates: siteUrl ? { canonical: `${siteUrl}/grease-trap-cleaning` } : undefined,
  openGraph: {
    title: "Grease Trap Cleaning Providers",
    description:
      "Find trusted grease trap cleaning providers near you. Browse metro listings and connect with local service professionals.",
    url: siteUrl ? `${siteUrl}/grease-trap-cleaning` : undefined,
    type: "website",
  },
};

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

  const metros: MetroRow[] = (data ?? []).map((metro) => ({
    id: metro.id,
    name: metro.name,
    slug: metro.slug,
    state: metro.state,
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-4">
          <Badge className="w-fit" variant="secondary">
            Directory
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Grease Trap Cleaning Providers
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Browse top-rated grease trap cleaning providers by metro. Compare listings, request
            quotes, and book service fast.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/grease-trap-cleaning">Browse metros</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">List your business</Link>
            </Button>
          </div>
        </div>
        <Card className="border-border bg-muted/40 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Trusted local pros
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">How it works</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li>1. Choose your metro.</li>
                <li>2. Review listings and service areas.</li>
                <li>3. Request quotes directly.</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold text-foreground">What to expect</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Average response time under 2 hours. Verified, licensed providers.
              </p>
            </div>
          </div>
        </Card>
      </header>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Unable to load metros right now.
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Launch metros</h2>
          <p className="text-sm text-muted-foreground">{metros.length} metros</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metros.length === 0
            ? Array.from({ length: 6 }).map((_, index) => (
                <Card key={`skeleton-${index}`}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-40" />
                  </CardContent>
                </Card>
              ))
            : metros.map((metro) => (
                <Card key={metro.id} className="transition hover:border-primary/40">
                  <CardHeader>
                    <CardTitle className="text-lg">{metro.name}</CardTitle>
                    <Badge className="mt-2 w-fit" variant="outline">
                      {metro.state}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Explore providers</span>
                    <Link
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      href={`/grease-trap-cleaning/${metro.state.toLowerCase()}/${metro.slug}`}
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
        </div>
      </section>
    </main>
  );
}
