import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getUserContext } from "../../../lib/auth/getUserContext";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";

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
  delivery: { status: string; error: string | null; created_at: string } | null;
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
    return null;
  }

  const supabase = createServerSupabaseReadOnly();
  const providerId = providerUser.provider_id;

  const { data } = await supabase
    .schema("public")
    .from("leads")
    .select("id, created_at, status, name, email, phone, message, source_url")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  const { data: deliveries } = await supabase
    .schema("public")
    .from("lead_deliveries")
    .select("lead_id, status, error, created_at")
    .eq("provider_id", providerId)
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

  const leads: LeadRow[] = (data ?? []).map((lead) => ({
    id: lead.id,
    created_at: lead.created_at,
    status: lead.status,
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? null,
    message: lead.message ?? null,
    source_url: lead.source_url ?? null,
    delivery: latestDeliveryByLead.get(lead.id) ?? null,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  No leads yet.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{new Date(lead.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={lead.status === "new" ? "default" : "outline"}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phone ?? "—"}</TableCell>
                  <TableCell>
                    {lead.delivery ? (
                      <Badge variant={lead.delivery.status === "sent" ? "secondary" : "outline"}>
                        {lead.delivery.status}
                      </Badge>
                    ) : (
                      <Badge variant="outline">pending</Badge>
                    )}
                    {lead.delivery?.error ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {lead.delivery.error}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    {lead.message ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
