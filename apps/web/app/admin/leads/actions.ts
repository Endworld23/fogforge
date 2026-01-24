"use server";

import { isAdminServer } from "../../../lib/auth/isAdminServer";
import { assignMetroPoolLead } from "../../../lib/leads/assignMetroPoolLead";
import { deliverLead } from "../../../lib/leads/deliverLead";
import { recordLeadEvent } from "../../../lib/leads/recordLeadEvent";
import { getProviderState } from "../../../lib/providers/providerState";
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

const LEAD_STATES = ["NEW", "VIEWED", "CONTACTED", "ESCALATED", "RESOLVED"] as const;
type LeadState = (typeof LEAD_STATES)[number];
const LEAD_STATE_ORDER: LeadState[] = ["NEW", "VIEWED", "CONTACTED", "ESCALATED", "RESOLVED"];

function isValidUuid(value: string) {
  return UUID_REGEX.test(value);
}

function getLeadState(row: {
  viewed_at: string | null;
  last_contacted_at: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
}): LeadState {
  if (row.resolved_at) return "RESOLVED";
  if (row.escalated_at) return "ESCALATED";
  if (row.last_contacted_at) return "CONTACTED";
  if (row.viewed_at) return "VIEWED";
  return "NEW";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .schema("public")
    .from("leads")
    .update({
      status: "sent",
      delivery_status: "delivered",
      delivered_at: new Date().toISOString(),
      delivery_error: null,
    })
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

  await recordLeadEvent({
    leadId,
    actorType: "admin",
    actorUserId: user?.id ?? null,
    eventType: "delivery_succeeded",
    data: { method: "manual_mark_sent" },
  });

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  await recordLeadEvent({
    leadId: data.id,
    actorType: "admin",
    actorUserId: user?.id ?? null,
    eventType: "lead_created",
    data: { provider_id: providerId, source: "admin_test" },
  });

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .schema("public")
    .from("leads")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", leadId)
    .is("viewed_at", null);

  if (error) {
    return { ok: false, message: error.message };
  }

  await recordLeadEvent({
    leadId,
    actorType: "admin",
    actorUserId: user?.id ?? null,
    eventType: "status_updated",
    data: { status: "viewed" },
  });

  revalidatePath("/admin/leads");
  return { ok: true, message: "Lead marked as viewed." };
}

export async function moveLeadStageAction(
  leadId: string,
  targetState: LeadState
): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  if (!LEAD_STATES.includes(targetState)) {
    return { ok: false, message: "Invalid lead state." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  if (targetState === "NEW") {
    return { ok: false, message: "Cannot move leads back to new." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: leadRow, error: leadError } = await supabase
    .schema("public")
    .from("leads")
    .select("viewed_at, last_contacted_at, escalated_at, resolved_at, resolution_status")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    return { ok: false, message: leadError.message };
  }

  if (!leadRow) {
    return { ok: false, message: "Lead not found." };
  }

  const currentState = getLeadState(leadRow);
  const currentIndex = LEAD_STATE_ORDER.indexOf(currentState);
  const targetIndex = LEAD_STATE_ORDER.indexOf(targetState);

  if (targetIndex < currentIndex) {
    return { ok: false, message: "Cannot move a lead backward." };
  }

  if (currentState === targetState) {
    return { ok: true, message: "Lead already in this state." };
  }

  const now = new Date().toISOString();
  const updates: Record<string, string | null> = {};

  switch (targetState) {
    case "VIEWED":
      if (!leadRow.viewed_at) {
        updates.viewed_at = now;
      }
      break;
    case "CONTACTED":
      updates.last_contacted_at = now;
      break;
    case "ESCALATED":
      updates.escalated_at = now;
      updates.escalation_reason = "manual_board";
      break;
    case "RESOLVED":
      updates.resolved_at = now;
      updates.resolution_status = leadRow.resolution_status ?? "closed";
      break;
    default:
      break;
  }

  if (Object.keys(updates).length === 0) {
    return { ok: true, message: "Lead already up to date." };
  }

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update(updates)
    .eq("id", leadId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  await recordLeadEvent({
    leadId,
    actorType: "admin",
    actorUserId: user?.id ?? null,
    eventType: "moved_on_board",
    data: { from: currentState, to: targetState },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/leads/board");
  return { ok: true, message: "Lead updated." };
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .schema("public")
    .from("leads")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await recordLeadEvent({
    leadId,
    actorType: "admin",
    actorUserId: user?.id ?? null,
    eventType: "status_updated",
    data: { status: "contacted" },
  });

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  await recordLeadEvent({
    leadId,
    actorType: "admin",
    actorUserId: user?.id ?? null,
    eventType: "status_updated",
    data: { status: "resolved", resolution_status: resolutionStatus },
  });

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  await recordLeadEvent({
    leadId,
    actorType: "admin",
    actorUserId: user?.id ?? null,
    eventType: "status_updated",
    data: { follow_up_at: followUpValue, next_action: nextActionValue },
  });

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  await recordLeadEvent({
    leadId,
    actorType: "admin",
    actorUserId: user?.id ?? null,
    eventType: "status_updated",
    data: { status: "escalated", escalation_reason: escalationReason.trim() },
  });

  revalidatePath("/admin/leads");
  return { ok: true, message: "Lead escalated." };
}

export async function returnLeadToPoolAction(leadId: string): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: leadRow, error: leadError } = await supabase
    .schema("public")
    .from("leads")
    .select("id, provider_id, metro_id")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    return { ok: false, message: leadError.message };
  }

  if (!leadRow?.metro_id) {
    return { ok: false, message: "Lead not found." };
  }

  const previousProviderId = leadRow.provider_id ?? null;

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({
      provider_id: null,
      delivery_status: "pending",
      delivery_error: "Returned to pool by admin.",
    })
    .eq("id", leadId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  await recordLeadEvent({
    leadId,
    actorType: "admin",
    actorUserId: user?.id ?? null,
    eventType: "returned_to_pool",
    data: { previous_provider_id: previousProviderId, metro_id: leadRow.metro_id },
  });

  await assignMetroPoolLead(leadId, leadRow.metro_id, {
    excludeProviderIds: previousProviderId ? [previousProviderId] : [],
    actorType: "admin",
    actorUserId: user?.id ?? null,
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/leads/board");
  return { ok: true, message: "Lead returned to pool." };
}

export async function reassignLeadAction(
  leadId: string,
  providerId: string
): Promise<LeadActionResult> {
  if (!leadId || !providerId) {
    return { ok: false, message: "Missing lead or provider id." };
  }

  if (!isValidUuid(providerId)) {
    return { ok: false, message: "Provider id must be a valid UUID." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: leadRow, error: leadError }, { data: providerRow, error: providerError }] =
    await Promise.all([
      supabase
        .schema("public")
        .from("leads")
        .select("id, metro_id, provider_id")
        .eq("id", leadId)
        .maybeSingle(),
      supabase
        .schema("public")
        .from("providers")
        .select(
          "id, metro_id, is_published, status, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
        )
        .eq("id", providerId)
        .maybeSingle(),
    ]);

  if (leadError) {
    return { ok: false, message: leadError.message };
  }
  if (!leadRow?.metro_id) {
    return { ok: false, message: "Lead not found." };
  }
  if (providerError) {
    return { ok: false, message: providerError.message };
  }
  if (!providerRow || !providerRow.is_published || providerRow.status !== "active") {
    return { ok: false, message: "Provider is not eligible for reassignment." };
  }
  if (providerRow.metro_id !== leadRow.metro_id) {
    return { ok: false, message: "Provider metro does not match lead metro." };
  }
  if (getProviderState(providerRow) !== "VERIFIED") {
    return { ok: false, message: "Provider must be verified to receive leads." };
  }

  const previousProviderId = leadRow.provider_id ?? null;
  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({
      provider_id: providerId,
      delivery_status: "pending",
      delivery_error: null,
    })
    .eq("id", leadId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  await recordLeadEvent({
    leadId,
    actorType: "admin",
    actorUserId: user?.id ?? null,
    eventType: "admin_reassigned",
    data: { provider_id: providerId, previous_provider_id: previousProviderId },
  });

  await deliverLead(leadId);

  revalidatePath("/admin/leads");
  revalidatePath("/admin/leads/board");
  return { ok: true, message: "Lead reassigned." };
}

export async function resetMetroRotationAction(metroId: string): Promise<LeadActionResult> {
  if (!metroId) {
    return { ok: false, message: "Missing metro id." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .schema("public")
    .from("metro_lead_rotation")
    .update({ last_provider_id: null, last_assigned_at: null, updated_at: new Date().toISOString() })
    .eq("metro_id", metroId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/routing");
  return { ok: true, message: "Rotation reset." };
}
