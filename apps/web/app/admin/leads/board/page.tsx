import Link from "next/link";
import { redirect } from "next/navigation";
import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { isAdminServer } from "../../../../lib/auth/isAdminServer";
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
  escalation_reason: string | null;
  delivery_status: string;
  name: string;
  phone: string | null;
  provider: { business_name: string; slug: string } | null;
  metro: { name: string; slug: string; state: string } | null;
};

export default async function AdminLeadsBoardPage() {
  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("leads")
    .select(
      "id, created_at, viewed_at, last_contacted_at, resolved_at, resolution_status, escalated_at, escalation_reason, delivery_status, name, phone, providers(business_name,slug), metros(name,slug,state)"
    )
    .order("created_at", { ascending: false });

  const leads: LeadRowUI[] = (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    viewed_at: row.viewed_at ?? null,
    last_contacted_at: row.last_contacted_at ?? null,
    resolved_at: row.resolved_at ?? null,
    resolution_status: row.resolution_status ?? null,
    escalated_at: row.escalated_at ?? null,
    escalation_reason: row.escalation_reason ?? null,
    delivery_status: row.delivery_status ?? "pending",
    name: row.name,
    phone: row.phone ?? null,
    provider: row.providers?.[0] ?? null,
    metro: row.metros?.[0] ?? null,
  }));

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
          <LeadsBoard leads={leads} />
        </CardContent>
      </Card>
    </div>
  );
}
