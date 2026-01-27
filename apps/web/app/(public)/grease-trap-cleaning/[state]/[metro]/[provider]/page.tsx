import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
import { createServerSupabaseReadOnly } from "../../../../../../lib/supabase/server";
import { getSiteUrl } from "../../../../../../lib/seo";
import { getProviderState } from "../../../../../../lib/providers/providerState";
import { getPublicStorageUrl } from "../../../../../../lib/supabase/storageUrl";

type ProviderPageProps = {
  params: Promise<{ state: string; metro: string; provider: string }>;
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
  logo_url?: string | null;
  logo_path?: string | null;
  claim_status: string | null;
  verified_at: string | null;
  claimed_by_user_id: string | null;
  is_claimed: boolean | null;
  user_id: string | null;
  metros: { id: string; name: string; slug: string; state: string };
  categories: { id: string; slug: string; name: string };
};

const siteUrl = getSiteUrl();

export async function generateMetadata({
  params,
}: ProviderPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createServerSupabaseReadOnly();
  const { data: providerData } = await supabase
    .schema("public")
    .from("providers")
    .select("business_name, city, state, metro_id")
    .eq("slug", resolvedParams.provider)
    .eq("is_published", true)
    .eq("status", "active")
    .maybeSingle();

  const { data: metroData } = providerData?.metro_id
    ? await supabase
        .schema("public")
        .from("metros")
        .select("name, slug, state")
        .eq("id", providerData.metro_id)
        .maybeSingle()
    : { data: null };

  const providerName = providerData?.business_name ?? "Provider";
  const city = providerData?.city ?? "Local";
  const state =
    (metroData?.slug === resolvedParams.metro ? metroData?.state : providerData?.state) ??
    resolvedParams.state.toUpperCase();
  const title = `${providerName} – Grease Trap Cleaning in ${city}, ${state}`;
  const description = `Contact ${providerName} for grease trap cleaning services in ${city}, ${state}. Request a quote or call today.`;
  const canonical = siteUrl
    ? `${siteUrl}/grease-trap-cleaning/${resolvedParams.state}/${resolvedParams.metro}/${resolvedParams.provider}`
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
  const resolvedParams = await params;
  const supabase = await createServerSupabaseReadOnly();
  const { data: providerData, error: providerError } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, slug, business_name, city, state, phone, website_url, description, logo_url, logo_path, is_published, metro_id, category_id, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
    )
    .eq("slug", resolvedParams.provider)
    .eq("is_published", true)
    .eq("status", "active")
    .maybeSingle();

  if (providerError || !providerData) {
    notFound();
  }

  const [
    { data: metroData, error: metroError },
    { data: categoryData, error: categoryError },
    { data: media },
  ] = await Promise.all([
      providerData.metro_id
        ? supabase
            .schema("public")
            .from("metros")
            .select("id, name, slug, state")
            .eq("id", providerData.metro_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      providerData.category_id
        ? supabase
            .schema("public")
            .from("categories")
            .select("id, slug, name")
            .eq("id", providerData.category_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .schema("public")
        .from("provider_media")
        .select("id, url, sort_order, created_at")
        .eq("provider_id", providerData.id)
        .order("sort_order", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  if (
    metroError ||
    categoryError ||
    !metroData ||
    !categoryData ||
    metroData.slug !== resolvedParams.metro ||
    categoryData.slug !== "grease-trap-cleaning"
  ) {
    notFound();
  }

  const provider: ProviderRow = {
    id: providerData.id,
    slug: providerData.slug,
    business_name: providerData.business_name,
    city: providerData.city,
    state: providerData.state,
    phone: providerData.phone ?? null,
    website_url: providerData.website_url ?? null,
    description: providerData.description ?? null,
    is_published: providerData.is_published,
    logo_url: providerData.logo_url ?? null,
    logo_path: providerData.logo_path ?? null,
    claim_status: providerData.claim_status ?? null,
    verified_at: providerData.verified_at ?? null,
    claimed_by_user_id: providerData.claimed_by_user_id ?? null,
    is_claimed: providerData.is_claimed ?? null,
    user_id: providerData.user_id ?? null,
    metros: metroData,
    categories: categoryData,
  };

  const categoryLabel = provider.categories?.name ?? "Grease Trap Cleaning";
  const providerState = getProviderState(provider);
  const canShowMedia = providerState === "VERIFIED" && provider.is_published;
  const locationLabel =
    provider.city && provider.state ? `${provider.city}, ${provider.state}` : "Location not set";
  const logoUrl = canShowMedia
    ? provider.logo_url ?? getPublicStorageUrl("provider-logos", provider.logo_path ?? null)
    : null;
  const initials = provider.business_name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
                href={`/grease-trap-cleaning/${resolvedParams.state}/${resolvedParams.metro}`}
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
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${provider.business_name} logo`}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border border-border object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border text-xs font-semibold text-muted-foreground">
                {initials}
              </div>
            )}
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
            {providerState === "VERIFIED" ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </Badge>
            ) : null}
            {providerState === "UNCLAIMED" ? (
              <Link
                href={`/claim?provider=${provider.id}`}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Claim this business
              </Link>
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

      {canShowMedia && media?.length ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <Image
                src={photo.url}
                alt={`${provider.business_name} photo`}
                width={640}
                height={360}
                className="h-48 w-full object-cover"
                unoptimized
              />
            </Card>
          ))}
        </section>
      ) : null}

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
                Tell us what you need and we&apos;ll send your request to the provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button asChild className="w-full">
                <Link
                  href={`/grease-trap-cleaning/${resolvedParams.state}/${resolvedParams.metro}/${provider.slug}/request-quote`}
                >
                  Request a quote
                </Link>
              </Button>
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
