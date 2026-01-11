import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import ProvidersTable from "./ProvidersTable";

export default async function AdminProvidersPage() {
  const supabase = await createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("providers")
    .select("id, business_name, slug, status, is_published, provider_users(user_id)")
    .order("business_name", { ascending: true });

  const providers = (data ?? []).map((row) => ({
    id: row.id,
    business_name: row.business_name,
    slug: row.slug,
    status: row.status,
    is_published: row.is_published,
    provider_users: row.provider_users ?? null,
    isVerified: (row.provider_users ?? []).length > 0,
  }));

  const verifiedCount = providers.filter((provider) => provider.isVerified).length;
  const unclaimedCount = providers.length - verifiedCount;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Providers"
        description="Track verified providers and follow up with unclaimed listings."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verified providers</CardTitle>
            <CardDescription>Linked to a user account.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{verifiedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unclaimed providers</CardTitle>
            <CardDescription>Listings without a user account.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{unclaimedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All providers</CardTitle>
          <CardDescription>Click a provider to view details.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProvidersTable providers={providers} />
        </CardContent>
      </Card>
    </div>
  );
}
