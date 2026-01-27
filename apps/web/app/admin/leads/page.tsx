import Link from "next/link";
import { redirect } from "next/navigation";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { isAdminServer } from "../../../lib/auth/isAdminServer";
import { getProviderState } from "../../../lib/providers/providerState";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import CreateTestLeadDialog from "./CreateTestLeadDialog";
import LeadsTable from "./LeadsTable";

export const dynamic = "force-dynamic";

type LeadRowDTO = {
  id: string;
  created_at: string;
  provider_id: string | null;
  metro_id: string | null;
  status: string;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  resolution_status: string | null;
  escalated_at: string | null;
  escalation_reason: string | null;
  follow_up_at: string | null;
  next_action: string | null;
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
  metro_id: string | null;
  is_published?: boolean | null;
  status?: string | null;
  claim_status?: string | null;
  verified_at?: string | null;
  claimed_by_user_id?: string | null;
  is_claimed?: boolean | null;
  user_id?: string | null;
};

export default async function AdminLeadsPage() {
  const isAdmin = await isAdminServer();

  if (!isAdmin) {
    redirect("/login");
  }

  const resendApiKeySet = Boolean(process.env.RESEND_API_KEY?.trim());
  const leadsFromSet = Boolean(process.env.LEADS_FROM_EMAIL?.trim());
  const leadsBccSet = Boolean(process.env.LEADS_BCC_EMAIL?.trim());
  const leadsFallbackSet = Boolean(process.env.LEADS_FALLBACK_EMAIL?.trim());
  const requesterConfirmationEnabled = resendApiKeySet && leadsFromSet;
  const providerDeliveryEnabled = resendApiKeySet && leadsFromSet;

  const supabase = await createServerSupabaseReadOnly();
  const [{ data, error }, { data: providersData }] = await Promise.all([
    supabase
      .schema("public")
      .from("leads")
      .select(
        "id, created_at, provider_id, metro_id, status, viewed_at, last_contacted_at, resolved_at, resolution_status, escalated_at, escalation_reason, follow_up_at, next_action, delivery_status, delivered_at, delivery_error, name, email, phone, message, source_url, providers(business_name,slug), metros(name,slug,state), categories(slug,name)"
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

  const leads: LeadRowDTO[] = (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    provider_id: row.provider_id ?? null,
    metro_id: row.metro_id ?? null,
    status: row.status,
    viewed_at: row.viewed_at ?? null,
    last_contacted_at: row.last_contacted_at ?? null,
    resolved_at: row.resolved_at ?? null,
    resolution_status: row.resolution_status ?? null,
    escalated_at: row.escalated_at ?? null,
    escalation_reason: row.escalation_reason ?? null,
    follow_up_at: row.follow_up_at ?? null,
    next_action: row.next_action ?? null,
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
    metro_id: row.metro_id ?? null,
    is_published: row.is_published ?? null,
    status: row.status ?? null,
    claim_status: row.claim_status ?? null,
    verified_at: row.verified_at ?? null,
    claimed_by_user_id: row.claimed_by_user_id ?? null,
    is_claimed: row.is_claimed ?? null,
    user_id: row.user_id ?? null,
  }));

  const providerOptionsByMetro = providers
    .filter(
      (provider) =>
        provider.metro_id &&
        provider.is_published &&
        provider.status === "active" &&
        getProviderState(provider) === "VERIFIED"
    )
    .reduce<Record<string, { id: string; business_name: string | null }[]>>((acc, provider) => {
      if (!provider.metro_id) return acc;
      if (!acc[provider.metro_id]) {
        acc[provider.metro_id] = [];
      }
      acc[provider.metro_id].push({ id: provider.id, business_name: provider.business_name ?? null });
      return acc;
    }, {});

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads Inbox"
        description="Track incoming requests and delivery status in real time."
        action={
          <>
            <CreateTestLeadDialog providers={providers} />
            <Button asChild variant="outline">
              <Link href="/admin/leads/board">Board view</Link>
            </Button>
            <Badge variant="secondary">{leads.length} leads</Badge>
          </>
        }
      />

      {(() => {
        const missing = ["RESEND_API_KEY", "LEADS_FROM_EMAIL", "LEADS_BCC_EMAIL", "LEADS_FALLBACK_EMAIL"].filter(
          (key) => !process.env[key]
        );
        return missing.length ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertTitle>Delivery configuration incomplete</AlertTitle>
            <AlertDescription>
              Missing env vars: {missing.join(", ")}. Leads will be marked as skipped until configured.
            </AlertDescription>
          </Alert>
        ) : null;
      })()}

      {process.env.NODE_ENV !== "production" ? (
        <Card className="border-border/70 bg-muted/40">
          <CardHeader>
            <CardTitle>Delivery checklist (dev only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Required env vars</p>
              <ul className="space-y-1">
                <li>RESEND_API_KEY: {resendApiKeySet ? "set" : "missing"}</li>
                <li>LEADS_FROM_EMAIL: {leadsFromSet ? "set" : "missing"}</li>
                <li>LEADS_BCC_EMAIL: {leadsBccSet ? "set" : "missing"}</li>
                <li>LEADS_FALLBACK_EMAIL: {leadsFallbackSet ? "set" : "missing"}</li>
              </ul>
              <div className="mt-2 text-xs text-muted-foreground">
                Requester confirmation: {requesterConfirmationEnabled ? "enabled" : "disabled"} ·
                Provider delivery: {providerDeliveryEnabled ? "enabled" : "disabled"}
              </div>
            </div>
            <div>
              <p className="font-medium text-foreground">Migrations</p>
              <p>Apply 20260108040210_lead_delivery_status.sql and 20260120000000_provider_claim_status.sql.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Quick test</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Create test lead</li>
                <li>Send now</li>
                <li>Check delivery_status</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      ) : null}

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
          <LeadsTable leads={leads} providerOptionsByMetro={providerOptionsByMetro} />
        </CardContent>
      </Card>
    </div>
  );
}
