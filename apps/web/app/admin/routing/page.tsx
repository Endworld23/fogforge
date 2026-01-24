import { redirect } from "next/navigation";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { isAdminServer } from "../../../lib/auth/isAdminServer";
import { getProviderState } from "../../../lib/providers/providerState";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import MetroRoutingTable from "./MetroRoutingTable";

export const dynamic = "force-dynamic";

type ProviderRow = {
  id: string;
  business_name: string | null;
  metro_id: string | null;
  is_published: boolean | null;
  status: string | null;
  claim_status: string | null;
  verified_at: string | null;
  claimed_by_user_id: string | null;
  is_claimed: boolean | null;
  user_id: string | null;
};

export default async function AdminRoutingPage() {
  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseReadOnly();
  const [{ data: metros }, { data: providers }, { data: rotations }] = await Promise.all([
    supabase.schema("public").from("metros").select("id, name, state").order("name"),
    supabase
      .schema("public")
      .from("providers")
      .select(
        "id, business_name, metro_id, is_published, status, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
      )
      .order("business_name"),
    supabase
      .schema("public")
      .from("metro_lead_rotation")
      .select("metro_id, last_provider_id, last_assigned_at"),
  ]);

  const providerRows = (providers ?? []) as ProviderRow[];
  const eligibleProviders = providerRows.filter(
    (provider) =>
      provider.metro_id &&
      provider.is_published &&
      provider.status === "active" &&
      getProviderState(provider) === "VERIFIED"
  );

  const providersByMetro = eligibleProviders.reduce<Record<string, ProviderRow[]>>((acc, row) => {
    if (!row.metro_id) return acc;
    if (!acc[row.metro_id]) {
      acc[row.metro_id] = [];
    }
    acc[row.metro_id].push(row);
    return acc;
  }, {});

  const rotationByMetro = (rotations ?? []).reduce<
    Record<string, { last_provider_id: string | null; last_assigned_at: string | null }>
  >((acc, row) => {
    acc[row.metro_id] = {
      last_provider_id: row.last_provider_id ?? null,
      last_assigned_at: row.last_assigned_at ?? null,
    };
    return acc;
  }, {});

  const rows = (metros ?? []).map((metro) => ({
    id: metro.id,
    name: metro.name,
    state: metro.state,
    providers:
      providersByMetro[metro.id]?.sort((a, b) => a.id.localeCompare(b.id)).map((provider) => ({
        id: provider.id,
        business_name: provider.business_name ?? null,
      })) ?? [],
    last_provider_id: rotationByMetro[metro.id]?.last_provider_id ?? null,
    last_assigned_at: rotationByMetro[metro.id]?.last_assigned_at ?? null,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Metro Routing"
        description="Review provider order and reset rotation pointers."
      />
      <MetroRoutingTable metros={rows} />
    </div>
  );
}
