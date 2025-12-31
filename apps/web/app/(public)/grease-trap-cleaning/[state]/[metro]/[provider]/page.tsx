import Link from "next/link";
import { Badge } from "../../../../../../components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../../../../components/ui/breadcrumb";
import { Button } from "../../../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../../../../../lib/supabase/server";
import LeadForm from "./LeadForm";

type ProviderPageProps = {
  params: { state: string; metro: string; provider: string };
};

type ProviderRow = {
  id: string;
  business_name: string;
  slug: string;
  city: string;
  state: string;
  phone: string | null;
  website_url: string | null;
  description: string | null;
  metros: { id: string; name: string; slug: string; state: string } | null;
  categories: { id: string; slug: string; name: string } | null;
};

export default async function ProviderDetailPage({ params }: ProviderPageProps) {
  const supabase = createServerSupabaseReadOnly();
  const { data, error } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, slug, business_name, city, state, phone, website_url, description, metros!inner(id,name,slug,state), categories!inner(id,slug,name)"
    )
    .eq("slug", params.provider)
    .eq("metros.slug", params.metro)
    .eq("categories.slug", "grease-trap-cleaning")
    .eq("is_published", true)
    .eq("status", "active")
    .maybeSingle();

  const provider = (data ?? null) as ProviderRow | null;

  if (error || !provider || !provider.metros || !provider.categories) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Provider not found</CardTitle>
            <CardDescription>
              We couldn't find that listing. Try another provider or metro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/grease-trap-cleaning/${params.state}/${params.metro}`}>
                Back to metro
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

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
              <BreadcrumbLink
                href={`/grease-trap-cleaning/${params.state}/${params.metro}`}
              >
                {provider.metros.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{provider.business_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Badge className="w-fit" variant="secondary">
          Grease Trap Cleaning
        </Badge>
        <h1>{provider.business_name}</h1>
        <p>
          {provider.city}, {provider.state}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {provider.phone ? (
            <Button asChild>
              <a href={`tel:${provider.phone}`}>{provider.phone}</a>
            </Button>
          ) : null}
          {provider.website_url ? (
            <Button variant="outline" asChild>
              <a href={provider.website_url} target="_blank" rel="noreferrer">
                Visit website
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      {provider.description ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {provider.description}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Request a Quote</CardTitle>
          <CardDescription>
            Tell us a bit about your needs and we'll send your request to the provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadForm
            providerId={provider.id}
            categoryId={provider.categories.id}
            metroId={provider.metros.id}
          />
        </CardContent>
      </Card>
    </main>
  );
}
