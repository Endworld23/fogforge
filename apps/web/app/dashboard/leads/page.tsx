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

type LeadRowUI = {
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
      "id, created_at, status, delivery_status, delivered_at, delivery_error, name, email, phone, message, source_url"
    )
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  const leads: LeadRowUI[] = (data ?? []).map((lead) => ({
    id: lead.id,
    created_at: lead.created_at,
    status: lead.status,
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
                    <Badge variant={lead.delivery_status === "delivered" ? "secondary" : "outline"}>
                      {lead.delivery_status}
                    </Badge>
                    {lead.delivery_error ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {lead.delivery_error}
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
