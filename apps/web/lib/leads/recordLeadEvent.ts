import "server-only";

import { createServerSupabase } from "../supabase/server";

export type LeadEventActorType = "system" | "admin" | "provider" | "public";

type LeadEventInput = {
  leadId: string;
  actorType: LeadEventActorType;
  eventType: string;
  data?: Record<string, unknown>;
  actorUserId?: string | null;
};

export async function recordLeadEvent(input: LeadEventInput) {
  const supabase = await createServerSupabase();

  if (!input.leadId || !input.eventType) {
    return { ok: false, message: "Missing lead event data." };
  }

  const { error } = await supabase.rpc("record_lead_event", {
    p_lead_id: input.leadId,
    p_actor_type: input.actorType,
    p_event_type: input.eventType,
    p_data: input.data ?? {},
    p_actor_user_id: input.actorUserId ?? null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Event recorded." };
}
