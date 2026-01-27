import { redirect } from "next/navigation";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { Badge } from "../../../components/ui/badge";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import { isAdminServer } from "../../../lib/auth/isAdminServer";
import ClaimsTable from "./ClaimsTable";

export const dynamic = "force-dynamic";

type ClaimRow = {
  id: string;
  provider_id: string;
  requester_user_id: string;
  requester_email: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string | null;
  created_at: string;
  reviewed_at: string | null;
  provider: {
    business_name: string;
    city: string | null;
    state: string | null;
    verified_at: string | null;
  } | null;
};

export default async function AdminClaimsPage() {
  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseReadOnly();
  const { data: claims } = await supabase
    .schema("public")
    .from("provider_claim_requests")
    .select(
      "id, provider_id, requester_user_id, requester_email, status, message, created_at, reviewed_at, provider:providers(business_name, city, state, verified_at)"
    )
    .order("created_at", { ascending: false });

  const rows: ClaimRow[] = (claims ?? []).map((claim) => ({
    id: claim.id,
    provider_id: claim.provider_id,
    requester_user_id: claim.requester_user_id,
    requester_email: claim.requester_email ?? null,
    status: claim.status,
    message: claim.message ?? null,
    created_at: claim.created_at,
    reviewed_at: claim.reviewed_at ?? null,
    provider: claim.provider?.[0] ?? null,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Claim requests"
        description="Review and approve provider claim requests."
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{claims?.length ?? 0} requests</Badge>
      </div>
      <ClaimsTable claims={rows} />
    </div>
  );
}
