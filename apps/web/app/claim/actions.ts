"use server";

import { createServerSupabase } from "../../lib/supabase/server";
import { getProviderState } from "../../lib/providers/providerState";
import { sendClaimNotification } from "../../lib/claims/sendClaimNotification";

type ClaimActionResult = {
  ok: boolean;
  message: string;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export async function submitProviderClaimAction(
  _prevState: ClaimActionResult,
  formData: FormData
): Promise<ClaimActionResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please sign in to continue." };
  }

  const providerId = toText(formData.get("providerId"));
  const message = toText(formData.get("message"));

  if (!UUID_REGEX.test(providerId)) {
    return { ok: false, message: "Invalid provider selected." };
  }

  const { data: provider } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, business_name, is_published, status, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
    )
    .eq("id", providerId)
    .maybeSingle();

  if (!provider || !provider.is_published || provider.status !== "active") {
    return { ok: false, message: "This business is not available for claim." };
  }

  if (getProviderState(provider) !== "UNCLAIMED") {
    return { ok: false, message: "This business has already been claimed." };
  }

  const { data: existing } = await supabase
    .schema("public")
    .from("provider_claim_requests")
    .select("id")
    .eq("provider_id", providerId)
    .eq("requester_user_id", user.id)
    .eq("status", "PENDING")
    .maybeSingle();

  if (existing) {
    return { ok: false, message: "A claim request is already pending for this business." };
  }

  const { error } = await supabase
    .schema("public")
    .from("provider_claim_requests")
    .insert({
      provider_id: providerId,
      requester_user_id: user.id,
      requester_email: user.email ?? null,
      status: "PENDING",
      message: message || null,
    });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (user.email) {
    await sendClaimNotification({
      requesterEmail: user.email,
      requesterName: user.user_metadata?.full_name ?? null,
      providerName: provider.business_name ?? "this business",
      status: "submitted",
    });
  }

  return { ok: true, message: "Claim request submitted." };
}
