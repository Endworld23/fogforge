import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { isAdminServer } from "../../../../lib/auth/isAdminServer";
import { getProviderState } from "../../../../lib/providers/providerState";
import { createServerSupabaseReadOnly } from "../../../../lib/supabase/server";
import LeadDetailActions from "./LeadDetailActions";

export const dynamic = "force-dynamic";

type LeadEventRow = {
  id: string;
  actor_type: string;
  event_type: string;
  data: Record<string, unknown>;
  created_at: string;
};

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseReadOnly();
  const { data: lead } = await supabase
    .schema("public")
    .from("leads")
    .select(
      "id, created_at, status, provider_id, metro_id, name, email, phone, message, source_url, delivery_status, delivered_at, delivery_error, declined_at, decline_reason, requester_first_name, requester_last_name, requester_business_name, requester_address, viewed_at, last_contacted_at, resolved_at, resolution_status, escalated_at, escalation_reason, follow_up_at, next_action, providers(business_name,slug), metros(id,name,slug,state), categories(name)"
    )
    .eq("id", resolvedParams.id)
    .maybeSingle();

  if (!lead) {
    notFound();
  }

  const { data: events } = await supabase
    .schema("public")
    .from("lead_events")
    .select("id, actor_type, event_type, data, created_at")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false });

  const { data: providers } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, business_name, metro_id, is_published, status, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
    )
    .eq("metro_id", lead.metro_id)
    .order("business_name", { ascending: true });

  const providerOptions =
    providers
      ?.filter(
        (provider) =>
          provider.is_published &&
          provider.status === "active" &&
          getProviderState(provider) === "VERIFIED"
      )
      .map((provider) => ({
        id: provider.id,
        business_name: provider.business_name ?? null,
      })) ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Lead: ${lead.name}`}
        description="Full lead details and timeline."
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/leads">Back to list</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/leads/board">Board view</Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Lead overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-foreground">Requester</div>
            <div>{lead.requester_first_name || lead.requester_last_name ? `${lead.requester_first_name ?? ""} ${lead.requester_last_name ?? ""}`.trim() : lead.name}</div>
            <div>{lead.requester_business_name ?? "—"}</div>
            <div>{lead.requester_address ?? "—"}</div>
            <div>{lead.email}</div>
            <div>{lead.phone ?? "—"}</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-foreground">Lead status</div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{lead.status}</Badge>
              <Badge variant="outline">{lead.delivery_status ?? "pending"}</Badge>
            </div>
            <div>Created: {new Date(lead.created_at).toLocaleString()}</div>
            <div>Provider: {lead.providers?.[0]?.business_name ?? "Metro Pool"}</div>
            <div>Metro: {lead.metros?.[0] ? `${lead.metros[0].name}, ${lead.metros[0].state}` : "—"}</div>
            <div>Category: {lead.categories?.[0]?.name ?? "—"}</div>
            {lead.decline_reason ? <div>Declined: {lead.decline_reason}</div> : null}
            {lead.delivery_error ? <div>Delivery error: {lead.delivery_error}</div> : null}
            {lead.source_url ? (
              <div>
                Source:{" "}
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href={lead.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadDetailActions leadId={lead.id} providerOptions={providerOptions} status={lead.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground">
          {lead.message ? <p className="whitespace-pre-wrap">{lead.message}</p> : "No message provided."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(events ?? []).length ? (
            events?.map((event: LeadEventRow) => (
              <div key={event.id} className="rounded-md border border-border/70 bg-background p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-foreground">{event.event_type}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Actor: {event.actor_type}
                </div>
                {Object.keys(event.data ?? {}).length ? (
                  <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No events yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
