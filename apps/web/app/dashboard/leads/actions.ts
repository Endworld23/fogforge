"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";

type LeadActionResult = {
  ok: boolean;
  message: string;
};

const RESOLUTION_STATUSES = ["won", "lost", "closed", "spam"] as const;
type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

export async function markLeadViewedProviderAction(leadId: string): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Not authorized." };
  }

  const { data: leadRow, error: leadError } = await supabase
    .schema("public")
    .from("leads")
    .select("provider_id")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    return { ok: false, message: leadError.message };
  }

  if (!leadRow?.provider_id) {
    return { ok: false, message: "Lead not found." };
  }

  const { data: providerUser, error: providerError } = await supabase
    .schema("public")
    .from("provider_users")
    .select("provider_id")
    .eq("user_id", user.id)
    .eq("provider_id", leadRow.provider_id)
    .maybeSingle();

  if (providerError || !providerUser) {
    return { ok: false, message: "Not authorized." };
  }

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("provider_id", leadRow.provider_id)
    .is("viewed_at", null);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath("/dashboard/leads");
  return { ok: true, message: "Lead marked as viewed." };
}

export async function markLeadContactedProviderAction(leadId: string): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Not authorized." };
  }

  const { data: leadRow, error: leadError } = await supabase
    .schema("public")
    .from("leads")
    .select("provider_id")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    return { ok: false, message: leadError.message };
  }

  if (!leadRow?.provider_id) {
    return { ok: false, message: "Lead not found." };
  }

  const { data: providerUser, error: providerError } = await supabase
    .schema("public")
    .from("provider_users")
    .select("provider_id")
    .eq("user_id", user.id)
    .eq("provider_id", leadRow.provider_id)
    .maybeSingle();

  if (providerError || !providerUser) {
    return { ok: false, message: "Not authorized." };
  }

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("provider_id", leadRow.provider_id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath("/dashboard/leads");
  return { ok: true, message: "Lead marked as contacted." };
}

export async function setLeadResolvedProviderAction(
  leadId: string,
  resolutionStatus: ResolutionStatus
): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  if (!RESOLUTION_STATUSES.includes(resolutionStatus)) {
    return { ok: false, message: "Invalid resolution status." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Not authorized." };
  }

  const { data: leadRow, error: leadError } = await supabase
    .schema("public")
    .from("leads")
    .select("provider_id")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    return { ok: false, message: leadError.message };
  }

  if (!leadRow?.provider_id) {
    return { ok: false, message: "Lead not found." };
  }

  const { data: providerUser, error: providerError } = await supabase
    .schema("public")
    .from("provider_users")
    .select("provider_id")
    .eq("user_id", user.id)
    .eq("provider_id", leadRow.provider_id)
    .maybeSingle();

  if (providerError || !providerUser) {
    return { ok: false, message: "Not authorized." };
  }

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({
      resolved_at: new Date().toISOString(),
      resolution_status: resolutionStatus,
    })
    .eq("id", leadId)
    .eq("provider_id", leadRow.provider_id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath("/dashboard/leads");
  return { ok: true, message: "Lead resolved." };
}

export async function setLeadFollowUpProviderAction(
  leadId: string,
  followUpAt?: string | null,
  nextAction?: string | null
): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Not authorized." };
  }

  const { data: leadRow, error: leadError } = await supabase
    .schema("public")
    .from("leads")
    .select("provider_id")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    return { ok: false, message: leadError.message };
  }

  if (!leadRow?.provider_id) {
    return { ok: false, message: "Lead not found." };
  }

  const { data: providerUser, error: providerError } = await supabase
    .schema("public")
    .from("provider_users")
    .select("provider_id")
    .eq("user_id", user.id)
    .eq("provider_id", leadRow.provider_id)
    .maybeSingle();

  if (providerError || !providerUser) {
    return { ok: false, message: "Not authorized." };
  }

  const followUpValue = followUpAt?.trim() ? new Date(followUpAt).toISOString() : null;
  const nextActionValue = nextAction?.trim() ? nextAction.trim() : null;

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({
      follow_up_at: followUpValue,
      next_action: nextActionValue,
    })
    .eq("id", leadId)
    .eq("provider_id", leadRow.provider_id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath("/dashboard/leads");
  return { ok: true, message: "Follow-up saved." };
}
