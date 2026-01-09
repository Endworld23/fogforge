import Link from "next/link";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../../../lib/supabase/server";

type ProviderDetailProps = {
  params: { slug: string };
};

type ProviderRow = {
  id: string;
  business_name: string;
  slug: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  website_url: string | null;
  status: string;
  is_published: boolean;
  metros: { name: string; slug: string; state: string } | null;
};

export default async function ProviderDetailPage({ params }: ProviderDetailProps) {
  const supabase = await createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, business_name, slug, city, state, phone, website_url, status, is_published, metros(name, slug, state)"
    )
    .eq("slug", params.slug)
    .maybeSingle();

  const provider: ProviderRow | null = data
    ? {
        id: data.id,
        business_name: data.business_name,
        slug: data.slug,
        city: data.city ?? null,
        state: data.state ?? null,
        phone: data.phone ?? null,
        website_url: data.website_url ?? null,
        status: data.status,
        is_published: data.is_published,
        metros: data.metros?.[0] ?? null,
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{provider.business_name}</h2>
        <p className="text-sm text-muted-foreground">
          {provider.city && provider.state
            ? `${provider.city}, ${provider.state}`
            : "Location not set"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Provider profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{provider.status}</Badge>
              <Badge variant={provider.is_published ? "secondary" : "outline"}>
                {provider.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            <div>Phone: {provider.phone ?? "Not set"}</div>
            <div>Website: {provider.website_url ?? "Not set"}</div>
            <div>
              Metro: {provider.metros ? `${provider.metros.name}, ${provider.metros.state}` : "Not set"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Quick links for admin workflows.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {publicListing ? (
              <Button asChild>
                <Link href={publicListing}>View public listing</Link>
              </Button>
            ) : (
              <Button type="button" disabled>
                View public listing
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/admin/leads">View leads</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Impersonate view</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
