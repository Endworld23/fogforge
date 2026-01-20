import Link from "next/link";
import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../../../lib/supabase/server";
import ProviderActions from "./ProviderActions";

type ProviderDetailProps = {
  params: Promise<{ slug: string }>;
};

type ProviderRow = {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  city: string | null;
  state: string | null;
  street: string | null;
  postal_code: string | null;
  phone: string | null;
  email_public: string | null;
  website_url: string | null;
  status: string;
  is_published: boolean;
  is_claimed: boolean | null;
  user_id: string | null;
  metros: { name: string; slug: string; state: string } | null;
  categories: { name: string | null; slug: string } | null;
};

export default async function ProviderDetailPage({ params }: ProviderDetailProps) {
  const resolvedParams = await params;
  const supabase = await createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, business_name, slug, description, city, state, street, postal_code, phone, email_public, website_url, status, is_published, is_claimed, user_id, metros(name, slug, state), categories(name, slug)"
    )
    .eq("slug", resolvedParams.slug)
    .maybeSingle();

  const provider: ProviderRow | null = data
    ? {
        id: data.id,
        business_name: data.business_name,
        slug: data.slug,
        description: data.description ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        street: data.street ?? null,
        postal_code: data.postal_code ?? null,
        phone: data.phone ?? null,
        email_public: data.email_public ?? null,
        website_url: data.website_url ?? null,
        status: data.status,
        is_published: data.is_published,
        is_claimed: data.is_claimed ?? null,
        user_id: data.user_id ?? null,
        metros: data.metros?.[0] ?? null,
        categories: data.categories?.[0] ?? null,
      }
    : null;

  if (!provider) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No providers yet</CardTitle>
          <CardDescription>We could not find that provider record.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/admin/providers">Back to providers</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stateSlug = provider.metros?.state ?? provider.state;
  const publicListing =
    provider.metros && stateSlug
      ? `/grease-trap-cleaning/${stateSlug.toLowerCase()}/${provider.metros.slug}/${provider.slug}`
      : null;
  const locationLabel =
    provider.city && provider.state ? `${provider.city}, ${provider.state}` : "Location not set";
  const detailsSummary = [
    provider.metros ? `${provider.metros.name}, ${provider.metros.state}` : null,
    provider.categories?.name ?? provider.categories?.slug ?? null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={provider.business_name}
        description={detailsSummary ? `${locationLabel} • ${detailsSummary}` : locationLabel}
        action={
          <ProviderActions
            providerId={provider.id}
            isPublished={provider.is_published}
            publicUrl={publicListing}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{provider.status}</Badge>
        <Badge variant={provider.is_published ? "secondary" : "outline"}>
          {provider.is_published ? "Published" : "Draft"}
        </Badge>
        <Badge variant={provider.user_id ? "secondary" : "outline"}>
          {provider.user_id ? "Verified" : "Unclaimed"}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Listing details</CardTitle>
            <CardDescription>Core listing information and status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Business: {provider.business_name}</div>
            <div>Description: {provider.description ?? "Not set"}</div>
            <div>
              Category: {provider.categories?.name ?? provider.categories?.slug ?? "Not set"}
            </div>
            <div>
              Metro: {provider.metros ? `${provider.metros.name}, ${provider.metros.state}` : "Not set"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & location</CardTitle>
            <CardDescription>Public contact details and address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Phone: {provider.phone ?? "Not set"}</div>
            <div>Email: {provider.email_public ?? "Not set"}</div>
            <div>Website: {provider.website_url ?? "Not set"}</div>
            <div>Street: {provider.street ?? "Not set"}</div>
            <div>
              City/State: {provider.city && provider.state ? `${provider.city}, ${provider.state}` : "Not set"}
            </div>
            <div>Postal code: {provider.postal_code ?? "Not set"}</div>
          </CardContent>
        </Card>
      </div>

      {(provider.is_claimed || provider.user_id) && (
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Claim and ownership status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Claimed: {provider.is_claimed ? "Yes" : "No"}</div>
            <div>User ID: {provider.user_id ?? "Not linked"}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
