import { redirect } from "next/navigation";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { isAdminServer } from "../../../lib/auth/isAdminServer";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import CreateTestLeadDialog from "./CreateTestLeadDialog";
import LeadsTable from "./LeadsTable";

export const dynamic = "force-dynamic";

type LeadRowDTO = {
  id: string;
  created_at: string;
  status: string;
  delivery_status: string;
  delivered_at: string | null;
  delivery_error: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source_url: string | null;
  provider: { business_name: string; slug: string } | null;
  metro: { name: string; slug: string; state: string } | null;
  category: { slug: string; name: string | null } | null;
};

type ProviderOption = {
  id: string;
  business_name: string | null;
};

export default async function AdminLeadsPage() {
  const isAdmin = await isAdminServer();

  if (!isAdmin) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseReadOnly();
  const [{ data, error }, { data: providersData }] = await Promise.all([
    supabase
      .schema("public")
      .from("leads")
      .select(
        "id, created_at, status, delivery_status, delivered_at, delivery_error, name, email, phone, message, source_url, providers(business_name,slug), metros(name,slug,state), categories(slug,name)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .schema("public")
      .from("providers")
      .select("id, business_name")
      .order("business_name", { ascending: true }),
  ]);

  const leads: LeadRowDTO[] = (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    status: row.status,
    delivery_status: row.delivery_status ?? "pending",
    delivered_at: row.delivered_at ?? null,
    delivery_error: row.delivery_error ?? null,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    message: row.message ?? null,
    source_url: row.source_url ?? null,
    provider: row.providers?.[0] ?? null,
    metro: row.metros?.[0] ?? null,
    category: row.categories?.[0] ?? null,
  }));

  const providers: ProviderOption[] = (providersData ?? []).map((row) => ({
    id: row.id,
    business_name: row.business_name ?? null,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads Inbox"
        description="Track incoming requests and delivery status in real time."
        action={
          <>
            <CreateTestLeadDialog providers={providers} />
            <Badge variant="secondary">{leads.length} leads</Badge>
          </>
        }
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
