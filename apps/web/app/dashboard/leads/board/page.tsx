import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { getUserContext } from "../../../../lib/auth/getUserContext";
import { createServerSupabaseReadOnly } from "../../../../lib/supabase/server";
import LeadsBoard from "./LeadsBoard";

export const dynamic = "force-dynamic";

type LeadRowUI = {
  id: string;
  created_at: string;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  resolution_status: string | null;
  escalated_at: string | null;
  delivery_status: string;
  name: string;
  phone: string | null;
  metro: { name: string; state: string } | null;
};

export default async function DashboardLeadsBoardPage() {
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
      "id, created_at, viewed_at, last_contacted_at, resolved_at, escalated_at, resolution_status, delivery_status, name, phone, metros(name,state)"
    )
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  const leads: LeadRowUI[] = (data ?? []).map((lead) => ({
    id: lead.id,
    created_at: lead.created_at,
    viewed_at: lead.viewed_at ?? null,
    last_contacted_at: lead.last_contacted_at ?? null,
    resolved_at: lead.resolved_at ?? null,
    escalated_at: lead.escalated_at ?? null,
    resolution_status: lead.resolution_status ?? null,
    delivery_status: lead.delivery_status ?? "pending",
    name: lead.name,
    phone: lead.phone ?? null,
    metro: lead.metros?.[0] ?? null,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>Leads Board</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/leads">List view</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <LeadsBoard leads={leads} />
      </CardContent>
    </Card>
  );
}
