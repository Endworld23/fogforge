import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "../../../../../components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../../../components/ui/breadcrumb";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Separator } from "../../../../../components/ui/separator";
import { MapPin, ShieldCheck } from "lucide-react";
import { createServerSupabaseReadOnly } from "../../../../../lib/supabase/server";
import { cn } from "../../../../../lib/utils";
import { getSiteUrl } from "../../../../../lib/seo";
import ProviderResults from "./ProviderResults";

const PAGE_SIZE = 20;

type MetroCategoryPageProps = {
  params: { state: string; metro: string };
  searchParams?: { page?: string | string[] };
};

type ProviderRow = {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  state: string;
  phone: string | null;
  website_url: string | null;
};

const siteUrl = getSiteUrl();

export async function generateMetadata({
  params,
}: MetroCategoryPageProps): Promise<Metadata> {
  const supabase = await createServerSupabaseReadOnly();
  const { data: metroData } = await supabase
    .schema("public")
    .from("metros")
    .select("name, state")
    .eq("slug", params.metro)
    .maybeSingle();

  const metroName = metroData?.name ?? params.metro.replace(/-/g, " ");
  const metroState = metroData?.state ?? params.state.toUpperCase();
  const title = `Grease Trap Cleaning in ${metroName}, ${metroState}`;
  const description = `Browse grease trap cleaning providers serving ${metroName}, ${metroState}. Compare local businesses and request a quote.`;
  const canonical = siteUrl
    ? `${siteUrl}/grease-trap-cleaning/${params.state}/${params.metro}`
    : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function MetroCategoryPage({
  params,
  searchParams,
}: MetroCategoryPageProps) {
  const pageParam = Array.isArray(searchParams?.page)
    ? searchParams?.page[0]
    : searchParams?.page;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const rangeStart = (page - 1) * PAGE_SIZE;
  const rangeEnd = rangeStart + PAGE_SIZE - 1;

  const supabase = await createServerSupabaseReadOnly();
  const [{ data: metroData }, { data: categoryData }] = await Promise.all([
    supabase
      .schema("public")
      .from("metros")
      .select("id, name, slug")
      .eq("slug", params.metro)
      .maybeSingle(),
    supabase
      .schema("public")
      .from("categories")
      .select("id, slug")
      .eq("slug", "grease-trap-cleaning")
      .maybeSingle(),
  ]);

  const metroId = metroData?.id ?? null;
  const categoryId = categoryData?.id ?? null;
  const { data, error, count } = metroId && categoryId
    ? await supabase
        .schema("public")
        .from("providers")
        .select("id, slug, business_name, city, state, phone, website_url", { count: "exact" })
        .eq("metro_id", metroId)
        .eq("category_id", categoryId)
        .eq("is_published", true)
        .eq("status", "active")
        .order("business_name", { ascending: true })
        .range(rangeStart, rangeEnd)
    : { data: [], error: null, count: 0 };

  const providers: ProviderRow[] = (data ?? []).map((provider) => ({
    id: provider.id,
    slug: provider.slug,
    business_name: provider.business_name,
    city: provider.city,
    state: provider.state,
    phone: provider.phone ?? null,
    website_url: provider.website_url ?? null,
  }));
  const totalCount = count ?? 0;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = totalPages > 0 && page < totalPages;
  const metroName = metroData?.name ?? params.metro.replace(/-/g, " ");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/grease-trap-cleaning">Grease Trap Cleaning</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{metroName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Badge className="w-fit" variant="secondary">
          Grease Trap Cleaning
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Grease Trap Cleaning in {metroName}
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Browse {totalCount} trusted providers in this metro.
        </p>
      </header>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Unable to load providers right now.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <div className="space-y-6">
          {providers.length === 0 && !error ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No providers found for this metro yet. Check back soon or try a nearby area.
              </CardContent>
            </Card>
          ) : (
            <ProviderResults providers={providers} state={params.state} metro={params.metro} />
          )}

          {totalPages > 1 ? (
            <nav className="flex flex-wrap items-center justify-between gap-3 text-sm md:justify-end">
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm" disabled={!hasPrev}>
                  <Link
                    className={cn(!hasPrev && "pointer-events-none")}
                    href={`?page=${page - 1}`}
                    aria-disabled={!hasPrev}
                  >
                    Prev
                  </Link>
                </Button>
                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  const isActive = pageNumber === page;
                  return (
                    <Button
                      key={pageNumber}
                      asChild
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                    >
                      <Link href={`?page=${pageNumber}`}>{pageNumber}</Link>
                    </Button>
                  );
                })}
                <Button asChild variant="outline" size="sm" disabled={!hasNext}>
                  <Link
                    className={cn(!hasNext && "pointer-events-none")}
                    href={`?page=${page + 1}`}
                    aria-disabled={!hasNext}
                  >
                    Next
                  </Link>
                </Button>
              </div>
            </nav>
          ) : null}
        </div>
        <div className="space-y-4 lg:sticky lg:top-24">
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>Request quotes faster</CardTitle>
              <p className="text-sm text-muted-foreground">
                Share your details once and get responses from local pros.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                Verified listings and local coverage.
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                Average response time under 2 hours.
              </div>
              <Separator />
              <Button asChild className="w-full">
                <Link href="/grease-trap-cleaning">Request quotes</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Questions to ask</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Cleaning schedule options and compliance paperwork.</p>
              <p>Emergency availability and after-hours support.</p>
              <p>Service area coverage and pricing.</p>
              <Separator />
              <p>Typical response time: under 2 hours.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
