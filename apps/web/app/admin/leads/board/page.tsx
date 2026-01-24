import Link from "next/link";
import { redirect } from "next/navigation";
import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { isAdminServer } from "../../../../lib/auth/isAdminServer";
import { getProviderState } from "../../../../lib/providers/providerState";
import { createServerSupabaseReadOnly } from "../../../../lib/supabase/server";
import LeadsBoard from "./LeadsBoard";

export const dynamic = "force-dynamic";

type LeadRowUI = {
  id: string;
  created_at: string;
  provider_id: string | null;
  metro_id: string | null;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  resolution_status: string | null;
  escalated_at: string | null;
  escalation_reason: string | null;
  delivery_status: string;
  name: string;
  email: string | null;
  phone: string | null;
  provider: { business_name: string; slug: string } | null;
  metro: { id: string; name: string; slug: string; state: string } | null;
};

export default async function AdminLeadsBoardPage() {
  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseReadOnly();
  const [{ data }, { data: providerRows }] = await Promise.all([
    supabase
    .schema("public")
    .from("leads")
    .select(
      "id, created_at, provider_id, metro_id, viewed_at, last_contacted_at, resolved_at, resolution_status, escalated_at, escalation_reason, delivery_status, delivery_error, name, email, phone, providers(business_name,slug), metros(id,name,slug,state)"
    )
    .order("created_at", { ascending: false }),
    supabase
      .schema("public")
      .from("providers")
      .select(
        "id, business_name, metro_id, is_published, status, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
      )
      .order("business_name", { ascending: true }),
  ]);

  const leads: LeadRowUI[] = (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    provider_id: row.provider_id ?? null,
    metro_id: row.metro_id ?? null,
    viewed_at: row.viewed_at ?? null,
    last_contacted_at: row.last_contacted_at ?? null,
    resolved_at: row.resolved_at ?? null,
    resolution_status: row.resolution_status ?? null,
    escalated_at: row.escalated_at ?? null,
    escalation_reason: row.escalation_reason ?? null,
    delivery_status: row.delivery_status ?? "pending",
    delivery_error: row.delivery_error ?? null,
    name: row.name,
    email: row.email ?? null,
    phone: row.phone ?? null,
    provider: row.providers?.[0] ?? null,
    metro: row.metros?.[0] ?? null,
  }));

  const providerOptionsByMetro = (providerRows ?? [])
    .filter(
      (provider) =>
        provider.is_published &&
        provider.status === "active" &&
        getProviderState(provider) === "VERIFIED"
    )
    .reduce<Record<string, { id: string; business_name: string | null }[]>>((acc, provider) => {
      if (!provider.metro_id) {
        return acc;
      }
      if (!acc[provider.metro_id]) {
        acc[provider.metro_id] = [];
      }
      acc[provider.metro_id].push({
        id: provider.id,
        business_name: provider.business_name ?? null,
      });
      return acc;
    }, {});

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads Board"
        description="Track lead state at a glance."
        action={
          <Button asChild variant="outline">
            <Link href="/admin/leads">List view</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <LeadsBoard leads={leads} providerOptionsByMetro={providerOptionsByMetro} />
        </CardContent>
      </Card>
    </div>
  );
}
