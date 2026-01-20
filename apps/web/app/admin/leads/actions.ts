"use server";

import { isAdminServer } from "../../../lib/auth/isAdminServer";
import { deliverLead } from "../../../lib/leads/deliverLead";
import { createServerSupabase } from "../../../lib/supabase/server";
import { revalidatePath } from "next/cache";

type LeadActionResult = {
  ok: boolean;
  message: string;
};

type CreateTestLeadPayload = {
  providerId: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
};

type CreateTestLeadResult = {
  ok: boolean;
  message: string;
  leadId?: string;
};

const RESOLUTION_STATUSES = ["won", "lost", "closed", "spam"] as const;
type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string) {
  return UUID_REGEX.test(value);
}

export async function markLeadSentAction(leadId: string): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .schema("public")
    .from("leads")
    .update({ status: "sent" })
    .eq("id", leadId)
    .eq("status", "new")
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Lead is already updated or unavailable." };
  }

  return { ok: true, message: "Marked as sent." };
}

export async function resendLeadAction(leadId: string): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const result = await deliverLead(leadId);
  if (!result.ok) {
    return result;
  }

  revalidatePath("/admin/leads");
  return { ok: true, message: "Delivery marked as sent." };
}

export async function createTestLeadAction(
  payload: CreateTestLeadPayload
): Promise<CreateTestLeadResult> {
  const providerId = payload.providerId?.trim() ?? "";
  if (!providerId || !payload.name?.trim() || !payload.email?.trim()) {
    return { ok: false, message: "Provider, name, and email are required." };
  }

  if (!isValidUuid(providerId)) {
    return { ok: false, message: "Provider id must be a valid UUID." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = await createServerSupabase();
  const { data: providerRow, error: providerError } = await supabase
    .schema("public")
    .from("providers")
    .select("id")
    .eq("id", providerId)
    .maybeSingle();

  if (providerError) {
    return { ok: false, message: `Unable to confirm provider: ${providerError.message}` };
  }

  if (!providerRow) {
    return { ok: false, message: "Provider not found for test lead." };
  }

  const { data, error } = await supabase
    .schema("public")
    .from("leads")
    .insert({
      provider_id: providerId,
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || null,
      message: payload.message?.trim() || null,
      status: "new",
      delivery_status: "pending",
      source_url: "admin://test-lead",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: `Unable to create test lead for provider ${providerId}: ${error.message}`,
    };
  }

  if (!data) {
    return { ok: false, message: "Unable to create test lead." };
  }

  revalidatePath("/admin/leads");
  return { ok: true, message: "Test lead created.", leadId: data.id };
}

export async function markLeadViewedAction(leadId: string): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .schema("public")
    .from("leads")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", leadId)
    .is("viewed_at", null);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/leads");
  return { ok: true, message: "Lead marked as viewed." };
}

export async function markLeadContactedAction(leadId: string): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .schema("public")
    .from("leads")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/leads");
  return { ok: true, message: "Lead marked as contacted." };
}

export async function setLeadResolvedAction(
  leadId: string,
  resolutionStatus: ResolutionStatus
): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  if (!RESOLUTION_STATUSES.includes(resolutionStatus)) {
    return { ok: false, message: "Invalid resolution status." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .schema("public")
    .from("leads")
    .update({
      resolved_at: new Date().toISOString(),
      resolution_status: resolutionStatus,
    })
    .eq("id", leadId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/leads");
  return { ok: true, message: "Lead resolved." };
}

export async function setLeadFollowUpAction(
  leadId: string,
  followUpAt?: string | null,
  nextAction?: string | null
): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const followUpValue = followUpAt?.trim() ? new Date(followUpAt).toISOString() : null;
  const nextActionValue = nextAction?.trim() ? nextAction.trim() : null;

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .schema("public")
    .from("leads")
    .update({
      follow_up_at: followUpValue,
      next_action: nextActionValue,
    })
    .eq("id", leadId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/leads");
  return { ok: true, message: "Follow-up saved." };
}

export async function escalateLeadAction(
  leadId: string,
  escalationReason: string
): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  if (!escalationReason?.trim()) {
    return { ok: false, message: "Escalation reason is required." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .schema("public")
    .from("leads")
    .update({
      escalated_at: new Date().toISOString(),
      escalation_reason: escalationReason.trim(),
    })
    .eq("id", leadId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/leads");
  return { ok: true, message: "Lead escalated." };
}
