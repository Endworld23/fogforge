import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminEmptyState from "../../components/admin/AdminEmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../lib/supabase/server";

type ActivityRow = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  providers?: { business_name: string }[] | null;
};

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseReadOnly();
  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    leadsToday,
    leadsWeek,
    providersTotal,
    providersPublished,
    providersDraft,
    onboardingPending,
    activityData,
  ] = await Promise.all([
    supabase
      .schema("public")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .schema("public")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase.schema("public").from("providers").select("id", { count: "exact", head: true }),
    supabase
      .schema("public")
      .from("providers")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .schema("public")
      .from("providers")
      .select("id", { count: "exact", head: true })
      .eq("is_published", false),
    supabase
      .schema("public")
      .from("onboarding_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .schema("public")
      .from("leads")
      .select("id, created_at, name, email, providers(business_name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const activityRows = (activityData.data ?? []).map((row: ActivityRow) => ({
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    email: row.email,
    provider: row.providers?.[0]?.business_name ?? "Unknown provider",
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Overview"
        description="Snapshot of today’s lead flow and provider activity."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
            <CardDescription>Snapshot of inbound demand.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-semibold text-foreground">{leadsToday.count ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
              <p className="text-2xl font-semibold text-foreground">{leadsWeek.count ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Providers</CardTitle>
            <CardDescription>Published vs draft listings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold text-foreground">{providersTotal.count ?? 0}</p>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-xl font-semibold text-foreground">
                  {providersPublished.count ?? 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-xl font-semibold text-foreground">
                  {providersDraft.count ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding</CardTitle>
            <CardDescription>Pending approval requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">
              {onboardingPending.count ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Latest lead activity across metros.</CardDescription>
          </CardHeader>
          <CardContent>
            {activityRows.length === 0 ? (
              <AdminEmptyState
                title="No recent activity yet"
                description="New lead activity will show here as requests come in."
              />
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                {activityRows.map((row) => (
                  <div key={row.id} className="flex flex-col gap-1">
                    <p className="font-medium text-foreground">{row.provider}</p>
                    <p>
                      {row.name ?? "New lead"} · {row.email ?? "No email provided"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
