import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../../../../components/ui/breadcrumb";
import { Badge } from "../../../../../../components/ui/badge";
import { Button } from "../../../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../../components/ui/card";
import { Separator } from "../../../../../../components/ui/separator";
import { Globe, MapPin, Phone, ShieldCheck } from "lucide-react";
import { isProviderVerified } from "../../../../../../lib/public/verified";
import { createServerSupabaseReadOnly } from "../../../../../../lib/supabase/server";
import { getSiteUrl } from "../../../../../../lib/seo";
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
  is_published: boolean;
  metros: { id: string; name: string; slug: string; state: string } | null;
  categories: { id: string; slug: string; name: string } | null;
};

const siteUrl = getSiteUrl();

export async function generateMetadata({
  params,
}: ProviderPageProps): Promise<Metadata> {
  const supabase = await createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "business_name, city, state, metros!inner(name,slug,state), categories!inner(slug)"
    )
    .eq("slug", params.provider)
    .eq("metros.slug", params.metro)
    .eq("categories.slug", "grease-trap-cleaning")
    .eq("is_published", true)
    .eq("status", "active")
    .maybeSingle();

  const providerName = data?.business_name ?? "Provider";
  const city = data?.city ?? "Local";
  const state = data?.state ?? params.state.toUpperCase();
  const title = `${providerName} – Grease Trap Cleaning in ${city}, ${state}`;
  const description = `Contact ${providerName} for grease trap cleaning services in ${city}, ${state}. Request a quote or call today.`;
  const canonical = siteUrl
    ? `${siteUrl}/grease-trap-cleaning/${params.state}/${params.metro}/${params.provider}`
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

export default async function ProviderDetailPage({ params }: ProviderPageProps) {
  const supabase = await createServerSupabaseReadOnly();
  const { data, error } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, slug, business_name, city, state, phone, website_url, description, is_published, metros!inner(id,name,slug,state), categories!inner(id,slug,name)"
    )
    .eq("slug", params.provider)
    .eq("metros.slug", params.metro)
    .eq("categories.slug", "grease-trap-cleaning")
    .eq("is_published", true)
    .eq("status", "active")
    .maybeSingle();

  const provider: ProviderRow | null = data
    ? {
        id: data.id,
        slug: data.slug,
        business_name: data.business_name,
        city: data.city,
        state: data.state,
        phone: data.phone ?? null,
        website_url: data.website_url ?? null,
        description: data.description ?? null,
        is_published: data.is_published,
        metros: data.metros?.[0] ?? null,
        categories: data.categories?.[0] ?? null,
      }
    : null;

  if (error || !provider || !provider.metros || !provider.categories) {
    const providerName = params.provider
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    const metroName = params.metro
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    const stateLabel = params.state.toUpperCase();

    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-4">
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
                  {metroName}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{providerName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Badge className="w-fit" variant="secondary">
            Grease Trap Cleaning
          </Badge>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {providerName}
            </h1>
            <Badge variant="outline">Unclaimed listing</Badge>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground md:text-base">
            <MapPin className="h-4 w-4" />
            {metroName}, {stateLabel}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
                <CardDescription>
                  This business has not claimed their listing yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Fogforge helps operators connect with trusted grease trap cleaning partners.
                  Claim this listing to add accurate service details and start receiving leads.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Service area</CardTitle>
                <CardDescription>
                  Serving {metroName}, {stateLabel}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Service coverage and response times will appear once the business claims this
                profile.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Accreditations</CardTitle>
                <CardDescription>Pending verification</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Licensing, insurance, and compliance details will be listed here.
              </CardContent>
            </Card>
          </div>
          <div className="lg:sticky lg:top-24">
            <Card>
              <CardHeader>
                <CardTitle>Claim this business</CardTitle>
                <CardDescription>
                  Manage this listing and start receiving qualified leads.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild>
                  <Link href={`/onboarding?mode=claim&slug=${params.provider}`}>
                    Claim this business
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/grease-trap-cleaning/${params.state}/${params.metro}`}>
                    Back to metro
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  const categoryLabel = provider.categories?.name ?? "Grease Trap Cleaning";
  const isVerified = isProviderVerified(provider);
  const locationLabel =
    provider.city && provider.state ? `${provider.city}, ${provider.state}` : "Location not set";

  if (!provider.is_published) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-4">
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
          {categoryLabel}
        </Badge>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {provider.business_name}
            </h1>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground md:text-base">
            <MapPin className="h-4 w-4" />
            {locationLabel}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Published</Badge>
            {isVerified ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {provider.phone ? (
            <Button asChild>
              <a href={`tel:${provider.phone}`} className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call {provider.phone}
              </a>
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Phone: Not listed</span>
          )}
          {provider.website_url ? (
            <Button variant="outline" asChild>
              <a
                href={provider.website_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                Visit website
              </a>
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Website: Not listed</span>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="order-2 space-y-6 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>
                Professional grease trap cleaning and compliance support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                {provider.description ??
                  "This provider offers scheduled and emergency grease trap cleaning with compliance support."}
              </p>
              <Separator />
              <ul className="space-y-2">
                <li>Licensed and insured technicians.</li>
                <li>Flexible scheduling with reminders.</li>
                <li>Detailed service documentation.</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Service area</CardTitle>
              <CardDescription>
                Serving {provider.metros.name}, {provider.metros.state}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Based in {provider.city}, {provider.state} with coverage across nearby neighborhoods.
            </CardContent>
          </Card>
        </div>
        <div className="order-1 lg:order-2 lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <CardTitle>Request a Quote</CardTitle>
              <CardDescription>
                Tell us a bit about your needs and we&apos;ll send your request to the provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LeadForm
                providerId={provider.id}
                categoryId={provider.categories.id}
                metroId={provider.metros.id}
              />
              <Card className="border-border/70 bg-muted/40">
                <CardHeader>
                  <CardTitle className="text-base">Quick facts</CardTitle>
                  <CardDescription>Helpful details at a glance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Phone listed: {provider.phone ? "Yes" : "No"}</p>
                  <p>Website listed: {provider.website_url ? "Yes" : "No"}</p>
                  <p>Location: {locationLabel}</p>
                  <p>Category: {categoryLabel}</p>
                </CardContent>
              </Card>
              <Separator />
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-sm font-semibold text-foreground">What happens next</p>
                <ul className="space-y-2">
                  <li>1. Submit your request.</li>
                  <li>2. The provider contacts you with availability.</li>
                  <li>3. You decide if you want to move forward.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
