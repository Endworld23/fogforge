import { redirect } from "next/navigation";
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
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Leads Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Unable to load leads right now.
            </div>
          ) : null}
          <LeadsTable leads={leads} />
        </CardContent>
      </Card>
    </main>
  );
}
