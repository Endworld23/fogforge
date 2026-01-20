import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { getProviderState } from "../../../lib/providers/providerState";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import ProvidersTable from "./ProvidersTable";

export default async function AdminProvidersPage() {
  const supabase = await createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, business_name, slug, status, is_published, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
    )
    .order("business_name", { ascending: true });

  const providers = (data ?? []).map((row) => ({
    id: row.id,
    business_name: row.business_name,
    slug: row.slug,
    status: row.status,
    is_published: row.is_published,
    provider_state: getProviderState({
      claim_status: row.claim_status ?? null,
      verified_at: row.verified_at ?? null,
      claimed_by_user_id: row.claimed_by_user_id ?? null,
      is_claimed: row.is_claimed ?? null,
      user_id: row.user_id ?? null,
    }),
  }));

  const verifiedCount = providers.filter((provider) => provider.provider_state === "VERIFIED").length;
  const unclaimedCount = providers.filter((provider) => provider.provider_state === "UNCLAIMED").length;
  const claimedUnverifiedCount = providers.filter(
    (provider) => provider.provider_state === "CLAIMED_UNVERIFIED"
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Providers"
        description="Track provider claim status and publish state."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Verified providers</CardTitle>
            <CardDescription>Verified and eligible for delivery.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{verifiedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Claimed (unverified)</CardTitle>
            <CardDescription>Awaiting verification.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{claimedUnverifiedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unclaimed providers</CardTitle>
            <CardDescription>No owner assigned.</CardDescription>
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
