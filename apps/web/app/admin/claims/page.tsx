import { redirect } from "next/navigation";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { Badge } from "../../../components/ui/badge";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import { isAdminServer } from "../../../lib/auth/isAdminServer";
import ClaimsTable from "./ClaimsTable";
import { getProviderState } from "../../../lib/providers/providerState";

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
  claimant_first_name: string | null;
  claimant_last_name: string | null;
  claimant_phone: string | null;
  claimant_role: string | null;
  claimant_role_other: string | null;
  claimant_address_line1: string | null;
  claimant_address_line2: string | null;
  claimant_city: string | null;
  claimant_state: string | null;
  claimant_zip: string | null;
  provider: {
    business_name: string;
    city: string | null;
    state: string | null;
    verified_at: string | null;
    claim_status: string | null;
    is_published: boolean | null;
    claimed_by_user_id: string | null;
    is_claimed: boolean | null;
    user_id: string | null;
    metros: { name: string; state: string }[] | null;
  } | null;
  documents: { id: string; doc_type: string; file_url: string }[];
  provider_state: "UNCLAIMED" | "CLAIMED_UNVERIFIED" | "VERIFIED";
  is_published: boolean;
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
      "id, provider_id, requester_user_id, requester_email, status, message, created_at, reviewed_at, claimant_first_name, claimant_last_name, claimant_phone, claimant_role, claimant_role_other, claimant_address_line1, claimant_address_line2, claimant_city, claimant_state, claimant_zip, provider:providers(business_name, city, state, verified_at, claim_status, is_published, claimed_by_user_id, is_claimed, user_id, metros(name,state)), documents:provider_claim_request_documents(id, doc_type, file_url)"
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
    claimant_first_name: claim.claimant_first_name ?? null,
    claimant_last_name: claim.claimant_last_name ?? null,
    claimant_phone: claim.claimant_phone ?? null,
    claimant_role: claim.claimant_role ?? null,
    claimant_role_other: claim.claimant_role_other ?? null,
    claimant_address_line1: claim.claimant_address_line1 ?? null,
    claimant_address_line2: claim.claimant_address_line2 ?? null,
    claimant_city: claim.claimant_city ?? null,
    claimant_state: claim.claimant_state ?? null,
    claimant_zip: claim.claimant_zip ?? null,
    provider: claim.provider?.[0] ?? null,
    documents: claim.documents ?? [],
    provider_state: getProviderState({
      claim_status: claim.provider?.[0]?.claim_status ?? null,
      verified_at: claim.provider?.[0]?.verified_at ?? null,
      claimed_by_user_id: claim.provider?.[0]?.claimed_by_user_id ?? null,
      is_claimed: claim.provider?.[0]?.is_claimed ?? null,
      user_id: claim.provider?.[0]?.user_id ?? null,
    }),
    is_published: Boolean(claim.provider?.[0]?.is_published),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Claim requests"
        description="Review and approve provider claim requests."
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{rows.length} requests</Badge>
      </div>
      <ClaimsTable claims={rows} />
    </div>
  );
}
