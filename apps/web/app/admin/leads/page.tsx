import { redirect } from "next/navigation";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { isAdminServer } from "../../../lib/auth/isAdminServer";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import LeadsTable from "./LeadsTable";

export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  created_at: string;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source_url: string | null;
  provider: { business_name: string; slug: string } | null;
  metro: { name: string; slug: string; state: string } | null;
  category: { slug: string; name: string | null } | null;
  delivery: { status: string; error: string | null; created_at: string } | null;
};

export default async function AdminLeadsPage() {
  const isAdmin = await isAdminServer();

  if (!isAdmin) {
    redirect("/login");
  }

  const supabase = createServerSupabaseReadOnly();
  const { data, error } = await supabase
    .schema("public")
    .from("leads")
    .select(
      "id, created_at, status, name, email, phone, message, source_url, providers(business_name,slug), metros(name,slug,state), categories(slug,name)"
    )
    .order("created_at", { ascending: false });

  const { data: deliveries } = await supabase
    .schema("public")
    .from("lead_deliveries")
    .select("lead_id, status, error, created_at")
    .order("created_at", { ascending: false });

  const latestDeliveryByLead = new Map<string, { status: string; error: string | null; created_at: string }>();
  (deliveries ?? []).forEach((delivery) => {
    if (!latestDeliveryByLead.has(delivery.lead_id)) {
      latestDeliveryByLead.set(delivery.lead_id, {
        status: delivery.status,
        error: delivery.error ?? null,
        created_at: delivery.created_at,
      });
    }
  });

  const leads: LeadRow[] = (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    status: row.status,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    message: row.message ?? null,
    source_url: row.source_url ?? null,
    provider: row.providers?.[0] ?? null,
    metro: row.metros?.[0] ?? null,
    category: row.categories?.[0] ?? null,
    delivery: latestDeliveryByLead.get(row.id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads Inbox"
        description="Track incoming requests and delivery status in real time."
        action={<Badge variant="secondary">{leads.length} leads</Badge>}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load leads</AlertTitle>
          <AlertDescription>
            Please refresh or try again in a few minutes.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Latest requests</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadsTable leads={leads} />
        </CardContent>
      </Card>
    </div>
  );
}
