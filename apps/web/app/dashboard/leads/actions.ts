"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";

type LeadActionResult = {
  ok: boolean;
  message: string;
};

const RESOLUTION_STATUSES = ["won", "lost", "closed", "spam"] as const;
type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

class LeadAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadAuthorizationError";
  }
}

type AuthorizedProviderContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  providerId: string;
};

async function getAuthorizedProviderIdForLead(leadId: string): Promise<AuthorizedProviderContext> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new LeadAuthorizationError("Not authorized.");
  }

  const { data: leadRow, error: leadError } = await supabase
    .schema("public")
    .from("leads")
    .select("provider_id")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    throw new LeadAuthorizationError(leadError.message);
  }

  if (!leadRow?.provider_id) {
    throw new LeadAuthorizationError("Lead not found.");
  }

  const { data: providerUser, error: providerError } = await supabase
    .schema("public")
    .from("provider_users")
    .select("provider_id")
    .eq("user_id", user.id)
    .eq("provider_id", leadRow.provider_id)
    .maybeSingle();

  if (providerError || !providerUser) {
    throw new LeadAuthorizationError("Not authorized.");
  }

  return { supabase, providerId: leadRow.provider_id };
}

export async function markLeadViewedProviderAction(leadId: string): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  let supabase: AuthorizedProviderContext["supabase"];
  let providerId: string;

  try {
    ({ supabase, providerId } = await getAuthorizedProviderIdForLead(leadId));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unknown error." };
  }

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("provider_id", providerId)
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

  let supabase: AuthorizedProviderContext["supabase"];
  let providerId: string;

  try {
    ({ supabase, providerId } = await getAuthorizedProviderIdForLead(leadId));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unknown error." };
  }

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("provider_id", providerId);

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

  let supabase: AuthorizedProviderContext["supabase"];
  let providerId: string;

  try {
    ({ supabase, providerId } = await getAuthorizedProviderIdForLead(leadId));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unknown error." };
  }

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({
      resolved_at: new Date().toISOString(),
      resolution_status: resolutionStatus,
    })
    .eq("id", leadId)
    .eq("provider_id", providerId);

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

  let supabase: AuthorizedProviderContext["supabase"];
  let providerId: string;

  try {
    ({ supabase, providerId } = await getAuthorizedProviderIdForLead(leadId));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unknown error." };
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
    .eq("provider_id", providerId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath("/dashboard/leads");
  return { ok: true, message: "Follow-up saved." };
}
