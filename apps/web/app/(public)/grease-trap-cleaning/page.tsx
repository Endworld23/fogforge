import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { ShieldCheck } from "lucide-react";
import { getSiteUrl } from "../../../lib/seo";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import MetroDirectoryClient from "./MetroDirectoryClient";

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

type GreaseTrapCleaningPageProps = {
  searchParams?: Promise<{ query?: string | string[] }>;
};

export default async function GreaseTrapCleaningPage({ searchParams }: GreaseTrapCleaningPageProps) {
  const supabase = await createServerSupabaseReadOnly();
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
  const resolvedParams = await Promise.resolve(searchParams);
  const queryParam = Array.isArray(resolvedParams?.query)
    ? resolvedParams?.query[0]
    : resolvedParams?.query;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12">
      <header className="space-y-6">
        <Badge className="w-fit" variant="secondary">
          Grease Trap Cleaning
        </Badge>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Find trusted grease trap cleaning providers.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Compare vetted local businesses, request quotes fast, and keep compliance on track with
            one clean directory.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="#metros">Browse providers</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/request-quote">Request a quote</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Find a provider",
            description: "Browse verified grease trap cleaning companies in your metro.",
          },
          {
            title: "Send a request",
            description: "Share your needs once and get matched with local pros.",
          },
          {
            title: "Get contacted",
            description: "Compare quotes, timelines, and service details before booking.",
          },
        ].map((item) => (
          <Card key={item.title} className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.description}</CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Verified businesses
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Listings show verified contact details like phone numbers or websites so you can reach
            decision-makers fast.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Published listings only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            We surface active, published providers so you can request quotes with confidence.
          </CardContent>
        </Card>
      </section>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Unable to load metros right now.
          </CardContent>
        </Card>
      ) : null}

      <section id="metros" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Browse by metro</h2>
          <Badge variant="outline">{metros.length} metros</Badge>
        </div>
        {metros.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No metros found.
            </CardContent>
          </Card>
        ) : (
          <MetroDirectoryClient metros={metros} initialQuery={queryParam ?? ""} />
        )}
      </section>

      <Card className="border-border">
        <CardContent className="flex flex-col gap-2 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>Don’t see your state or city? Get updates.</span>
          <a
            className="text-primary hover:underline"
            href="mailto:support@fogforge.com?subject=New%20metro%20request&body=Hi%20Fogforge%2C%0A%0APlease%20add%20my%20city%20and%20state%3A%0A%0ACity%3A%0AState%3A%0A%0AThanks!"
          >
            Email us
          </a>
        </CardContent>
      </Card>
    </main>
  );
}
