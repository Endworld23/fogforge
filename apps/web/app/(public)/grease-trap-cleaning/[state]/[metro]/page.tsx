import Link from "next/link";
import { Badge } from "../../../../../components/ui/badge";
import { buttonVariants } from "../../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { createServerSupabase } from "../../../../../lib/supabase/server";
import { cn } from "../../../../../lib/utils";

const PAGE_SIZE = 20;

type MetroCategoryPageProps = {
  params: { state: string; metro: string };
  searchParams?: { page?: string | string[] };
};

type ProviderRow = {
  id: string;
  business_name: string;
  city: string;
  state: string;
  phone: string | null;
  website_url: string | null;
  metros: { name: string; slug: string } | null;
};

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

  const supabase = createServerSupabase();
  const [{ data: metroData }, { data, error, count }] = await Promise.all([
    supabase.schema("public").from("metros").select("name, slug").eq("slug", params.metro).maybeSingle(),
    supabase
      .schema("public")
      .from("providers")
      .select(
        "id, business_name, city, state, phone, website_url, metros!inner(name,slug), categories!inner(slug)",
        { count: "exact" }
      )
      .eq("metros.slug", params.metro)
      .eq("categories.slug", "grease-trap-cleaning")
      .eq("is_published", true)
      .eq("status", "active")
      .order("business_name", { ascending: true })
      .range(rangeStart, rangeEnd),
  ]);

  const providers = (data ?? []) as ProviderRow[];
  const totalCount = count ?? 0;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = totalPages > 0 && page < totalPages;
  const metroName = metroData?.name ?? params.metro.replace(/-/g, " ");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <Badge className="w-fit" variant="secondary">
          Grease Trap Cleaning
        </Badge>
        <h1>Grease Trap Cleaning in {metroName}</h1>
        <p>Browse {totalCount} trusted providers.</p>
      </header>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Unable to load providers right now.
          </CardContent>
        </Card>
      ) : null}

      {providers.length === 0 && !error ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No providers found for this metro yet. Check back soon or try a nearby area.
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <CardTitle>{provider.business_name}</CardTitle>
                <CardDescription>
                  {provider.city}, {provider.state}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-foreground">
                {provider.phone ? (
                  <a className="text-primary underline-offset-4 hover:underline" href={`tel:${provider.phone}`}>
                    {provider.phone}
                  </a>
                ) : null}
                {provider.website_url ? (
                  <a
                    className="text-primary underline-offset-4 hover:underline"
                    href={provider.website_url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Visit website
                  </a>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                !hasPrev && "pointer-events-none opacity-50"
              )}
              href={`?page=${page - 1}`}
              aria-disabled={!hasPrev}
            >
              Prev
            </Link>
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;
              const isActive = pageNumber === page;
              return (
                <Link
                  key={pageNumber}
                  className={cn(
                    buttonVariants({ variant: isActive ? "default" : "outline", size: "sm" })
                  )}
                  href={`?page=${pageNumber}`}
                >
                  {pageNumber}
                </Link>
              );
            })}
            <Link
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                !hasNext && "pointer-events-none opacity-50"
              )}
              href={`?page=${page + 1}`}
              aria-disabled={!hasNext}
            >
              Next
            </Link>
          </div>
        </nav>
      ) : null}
    </main>
  );
}
