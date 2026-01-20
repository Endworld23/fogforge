import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { getUserContext } from "../../../lib/auth/getUserContext";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import LeadsTable from "./LeadsTable";

export const dynamic = "force-dynamic";

type LeadRowUI = {
  id: string;
  created_at: string;
  status: string;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  escalated_at: string | null;
  delivery_status: string;
  delivered_at: string | null;
  delivery_error: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source_url: string | null;
};

export default async function DashboardLeadsPage() {
  const { isAdmin, providerUser } = await getUserContext();

  if (!providerUser && isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>No provider is assigned to this admin account.</p>
          <Link className="text-primary underline-offset-4 hover:underline" href="/admin/leads">
            Go to admin leads
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!providerUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider leads</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This account is not linked to a provider yet.
        </CardContent>
      </Card>
    );
  }

  const supabase = await createServerSupabaseReadOnly();
  const providerId = providerUser.provider_id;

  const { data } = await supabase
    .schema("public")
    .from("leads")
    .select(
      "id, created_at, status, viewed_at, last_contacted_at, resolved_at, escalated_at, delivery_status, delivered_at, delivery_error, name, email, phone, message, source_url"
    )
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  const leads: LeadRowUI[] = (data ?? []).map((lead) => ({
    id: lead.id,
    created_at: lead.created_at,
    status: lead.status,
    viewed_at: lead.viewed_at ?? null,
    last_contacted_at: lead.last_contacted_at ?? null,
    resolved_at: lead.resolved_at ?? null,
    escalated_at: lead.escalated_at ?? null,
    delivery_status: lead.delivery_status ?? "pending",
    delivered_at: lead.delivered_at ?? null,
    delivery_error: lead.delivery_error ?? null,
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? null,
    message: lead.message ?? null,
    source_url: lead.source_url ?? null,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <LeadsTable leads={leads} />
      </CardContent>
    </Card>
  );
}
