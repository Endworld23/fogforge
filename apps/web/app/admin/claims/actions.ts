"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";
import { isAdminServer } from "../../../lib/auth/isAdminServer";
import { sendClaimNotification } from "../../../lib/claims/sendClaimNotification";

type ClaimActionResult = {
  ok: boolean;
  message: string;
};

export async function approveClaimRequestAction(claimRequestId: string): Promise<ClaimActionResult> {
  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Unauthorized." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: request, error: requestError } = await supabase
    .schema("public")
    .from("provider_claim_requests")
    .select("id, provider_id, requester_user_id, requester_email, status")
    .eq("id", claimRequestId)
    .maybeSingle();

  if (requestError || !request) {
    return { ok: false, message: "Claim request not found." };
  }

  if (request.status !== "PENDING") {
    return { ok: false, message: "Claim request already processed." };
  }

  const { data: provider } = await supabase
    .schema("public")
    .from("providers")
    .select("id, business_name")
    .eq("id", request.provider_id)
    .maybeSingle();

  const { error: providerError } = await supabase
    .schema("public")
    .from("providers")
    .update({
      claim_status: "claimed_unverified",
      claimed_by_user_id: request.requester_user_id,
      is_claimed: true,
    })
    .eq("id", request.provider_id);

  if (providerError) {
    return { ok: false, message: providerError.message };
  }

  const { error: linkError } = await supabase
    .schema("public")
    .from("provider_users")
    .upsert({ user_id: request.requester_user_id, provider_id: request.provider_id }, {
      onConflict: "user_id",
    });

  if (linkError) {
    return { ok: false, message: linkError.message };
  }

  const { error: updateError } = await supabase
    .schema("public")
    .from("provider_claim_requests")
    .update({
      status: "APPROVED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? null,
    })
    .eq("id", request.id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  if (request.requester_email) {
    await sendClaimNotification({
      requesterEmail: request.requester_email,
      requesterName: null,
      providerName: provider?.business_name ?? "this business",
      status: "approved",
    });
  }

  revalidatePath("/admin/claims");
  return { ok: true, message: "Claim approved." };
}

export async function rejectClaimRequestAction(claimRequestId: string): Promise<ClaimActionResult> {
  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Unauthorized." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: request, error: requestError } = await supabase
    .schema("public")
    .from("provider_claim_requests")
    .select("id, provider_id, requester_email, status")
    .eq("id", claimRequestId)
    .maybeSingle();

  if (requestError || !request) {
    return { ok: false, message: "Claim request not found." };
  }

  if (request.status !== "PENDING") {
    return { ok: false, message: "Claim request already processed." };
  }

  const { data: provider } = await supabase
    .schema("public")
    .from("providers")
    .select("id, business_name")
    .eq("id", request.provider_id)
    .maybeSingle();

  const { error: updateError } = await supabase
    .schema("public")
    .from("provider_claim_requests")
    .update({
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? null,
    })
    .eq("id", request.id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  if (request.requester_email) {
    await sendClaimNotification({
      requesterEmail: request.requester_email,
      requesterName: null,
      providerName: provider?.business_name ?? "this business",
      status: "rejected",
    });
  }

  revalidatePath("/admin/claims");
  return { ok: true, message: "Claim rejected." };
}

export async function verifyProviderFromClaimAction(providerId: string): Promise<ClaimActionResult> {
  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Unauthorized." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .schema("public")
    .from("providers")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", providerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/claims");
  return { ok: true, message: "Provider verified." };
}
