"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";
import { assignMetroPoolLead } from "../../../lib/leads/assignMetroPoolLead";
import { recordLeadEvent } from "../../../lib/leads/recordLeadEvent";

type LeadActionResult = {
  ok: boolean;
  message: string;
};

const RESOLUTION_STATUSES = ["won", "lost", "closed", "spam"] as const;
type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

const LEAD_STATES = ["NEW", "VIEWED", "CONTACTED", "ESCALATED", "RESOLVED"] as const;
type LeadState = (typeof LEAD_STATES)[number];

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

type AuthorizedProviderLeadContext = AuthorizedProviderContext & {
  lead: {
    metro_id: string | null;
    viewed_at: string | null;
    last_contacted_at: string | null;
    resolved_at: string | null;
    escalated_at: string | null;
    resolution_status: string | null;
  };
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

async function getAuthorizedProviderLead(
  leadId: string
): Promise<AuthorizedProviderLeadContext> {
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
    .select(
      "provider_id, metro_id, viewed_at, last_contacted_at, resolved_at, escalated_at, resolution_status"
    )
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

  return {
    supabase,
    providerId: leadRow.provider_id,
    lead: {
      metro_id: leadRow.metro_id ?? null,
      viewed_at: leadRow.viewed_at ?? null,
      last_contacted_at: leadRow.last_contacted_at ?? null,
      resolved_at: leadRow.resolved_at ?? null,
      escalated_at: leadRow.escalated_at ?? null,
      resolution_status: leadRow.resolution_status ?? null,
    },
  };
}

function getLeadState(lead: AuthorizedProviderLeadContext["lead"]): LeadState {
  if (lead.resolved_at) return "RESOLVED";
  if (lead.escalated_at) return "ESCALATED";
  if (lead.last_contacted_at) return "CONTACTED";
  if (lead.viewed_at) return "VIEWED";
  return "NEW";
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

  await recordLeadEvent({
    leadId,
    actorType: "provider",
    eventType: "status_updated",
    data: { status: "viewed" },
  });

  revalidatePath("/dashboard/leads");
  return { ok: true, message: "Lead marked as viewed." };
}

export async function moveLeadStageProviderAction(
  leadId: string,
  targetState: LeadState
): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  if (!LEAD_STATES.includes(targetState)) {
    return { ok: false, message: "Invalid lead state." };
  }

  let context: AuthorizedProviderLeadContext;

  try {
    context = await getAuthorizedProviderLead(leadId);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unknown error." };
  }

  if (targetState === "ESCALATED") {
    return { ok: false, message: "Escalation is admin-only." };
  }

  const currentState = getLeadState(context.lead);
  const allowedTransitions: Record<LeadState, LeadState[]> = {
    NEW: ["VIEWED"],
    VIEWED: ["CONTACTED"],
    CONTACTED: ["RESOLVED"],
    ESCALATED: [],
    RESOLVED: [],
  };

  if (currentState === targetState) {
    return { ok: true, message: "Lead already in this state." };
  }

  if (!allowedTransitions[currentState].includes(targetState)) {
    return { ok: false, message: "Invalid lead transition." };
  }

  const now = new Date().toISOString();
  const updates: Record<string, string | null> = {};

  switch (targetState) {
    case "VIEWED":
      if (!context.lead.viewed_at) {
        updates.viewed_at = now;
      }
      break;
    case "CONTACTED":
      updates.last_contacted_at = now;
      break;
    case "RESOLVED":
      updates.resolved_at = now;
      updates.resolution_status = context.lead.resolution_status ?? "closed";
      break;
    default:
      break;
  }

  if (Object.keys(updates).length === 0) {
    return { ok: true, message: "Lead already up to date." };
  }

  const { error: updateError } = await context.supabase
    .schema("public")
    .from("leads")
    .update(updates)
    .eq("id", leadId)
    .eq("provider_id", context.providerId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  await recordLeadEvent({
    leadId,
    actorType: "provider",
    eventType: "moved_on_board",
    data: { from: currentState, to: targetState },
  });

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/leads/board");
  return { ok: true, message: "Lead updated." };
}

export async function declineLeadProviderAction(
  leadId: string,
  reason: string,
  note?: string | null
): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  if (!reason?.trim()) {
    return { ok: false, message: "Decline reason is required." };
  }

  let context: AuthorizedProviderLeadContext;

  try {
    context = await getAuthorizedProviderLead(leadId);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unknown error." };
  }

  if (!context.lead.metro_id) {
    return { ok: false, message: "Lead not found." };
  }

  const reasonValue = reason.trim();
  const noteValue = note?.trim() ?? "";
  const declineMessage = noteValue ? `${reasonValue} — ${noteValue}` : reasonValue;
  const now = new Date().toISOString();

  const { error: updateError } = await context.supabase
    .schema("public")
    .from("leads")
    .update({
      provider_id: null,
      declined_at: now,
      decline_reason: declineMessage,
      declined_by_provider_id: context.providerId,
      delivery_status: "pending",
      delivery_error: "Returned to pool after provider decline.",
    })
    .eq("id", leadId)
    .eq("provider_id", context.providerId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  await recordLeadEvent({
    leadId,
    actorType: "provider",
    eventType: "provider_declined",
    data: { reason: reasonValue, note: noteValue || null, provider_id: context.providerId },
  });

  await recordLeadEvent({
    leadId,
    actorType: "provider",
    eventType: "returned_to_pool",
    data: { previous_provider_id: context.providerId, metro_id: context.lead.metro_id },
  });

  await assignMetroPoolLead(leadId, context.lead.metro_id, {
    excludeProviderIds: [context.providerId],
    actorType: "system",
  });

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/leads/board");
  return { ok: true, message: "Lead returned to the metro pool." };
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

  await recordLeadEvent({
    leadId,
    actorType: "provider",
    eventType: "status_updated",
    data: { status: "contacted" },
  });

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

  await recordLeadEvent({
    leadId,
    actorType: "provider",
    eventType: "status_updated",
    data: { status: "resolved", resolution_status: resolutionStatus },
  });

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

  await recordLeadEvent({
    leadId,
    actorType: "provider",
    eventType: "status_updated",
    data: { follow_up_at: followUpValue, next_action: nextActionValue },
  });

  revalidatePath("/dashboard/leads");
  return { ok: true, message: "Follow-up saved." };
}
