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
import { buttonVariants } from "../../../../../components/ui/button";
import { Card, CardContent } from "../../../../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../../../../lib/supabase/server";
import { cn } from "../../../../../lib/utils";
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

  const supabase = createServerSupabaseReadOnly();
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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
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
        <ProviderResults providers={providers} state={params.state} metro={params.metro} />
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
