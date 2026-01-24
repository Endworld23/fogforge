import "server-only";

import { getProviderState } from "../providers/providerState";
import { createServerSupabase } from "../supabase/server";
import { deliverLead } from "./deliverLead";
import { recordLeadEvent, type LeadEventActorType } from "./recordLeadEvent";

type AssignMetroPoolResult = {
  ok: boolean;
  assigned: boolean;
  providerId?: string;
  message?: string;
};

type AssignMetroPoolOptions = {
  excludeProviderIds?: string[];
  actorType?: LeadEventActorType;
  actorUserId?: string | null;
};

type EligibleProvider = {
  id: string;
  business_name: string | null;
  claim_status: string | null;
  verified_at: string | null;
  claimed_by_user_id: string | null;
  is_claimed: boolean | null;
  user_id: string | null;
  is_published: boolean | null;
};

const NO_PROVIDER_MESSAGE = "No verified providers available in metro.";

export async function assignMetroPoolLead(
  leadId: string,
  metroId: string,
  options: AssignMetroPoolOptions = {}
): Promise<AssignMetroPoolResult> {
  if (!leadId || !metroId) {
    return { ok: false, assigned: false, message: "Missing lead or metro id." };
  }

  const supabase = await createServerSupabase();
  const actorType = options.actorType ?? "system";
  const actorUserId = options.actorUserId ?? null;
  const excludeProviders = new Set(options.excludeProviderIds ?? []);
  const { data: providerRows, error: providersError } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, business_name, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id, is_published"
    )
    .eq("metro_id", metroId)
    .eq("is_published", true)
    .order("id", { ascending: true });

  if (providersError) {
    return { ok: false, assigned: false, message: providersError.message };
  }

  const eligibleProviders = (providerRows ?? []).filter((provider) => {
    if (!provider.is_published) return false;
    return getProviderState(provider) === "VERIFIED";
  }) as EligibleProvider[];

  const filteredProviders = eligibleProviders.filter(
    (provider) => !excludeProviders.has(provider.id)
  );

  if (filteredProviders.length === 0) {
    await supabase
      .schema("public")
      .from("leads")
      .update({
        provider_id: null,
        delivery_status: "skipped",
        delivery_error: NO_PROVIDER_MESSAGE,
      })
      .eq("id", leadId);
    await recordLeadEvent({
      leadId,
      actorType,
      actorUserId,
      eventType: "delivery_skipped",
      data: { metro_id: metroId, reason: NO_PROVIDER_MESSAGE },
    });
    return { ok: true, assigned: false, message: NO_PROVIDER_MESSAGE };
  }

  const { data: rotationRow, error: rotationError } = await supabase
    .schema("public")
    .from("metro_lead_rotation")
    .select("last_provider_id")
    .eq("metro_id", metroId)
    .maybeSingle();

  if (rotationError) {
    return { ok: false, assigned: false, message: rotationError.message };
  }

  const sortedProviders = [...filteredProviders].sort((a, b) => a.id.localeCompare(b.id));
  const lastProviderId = rotationRow?.last_provider_id ?? null;
  let nextProvider = sortedProviders[0];

  if (lastProviderId) {
    const lastIndex = sortedProviders.findIndex((provider) => provider.id === lastProviderId);
    if (lastIndex >= 0) {
      nextProvider = sortedProviders[(lastIndex + 1) % sortedProviders.length];
    }
  }

  const { error: rotationUpdateError } = await supabase
    .schema("public")
    .from("metro_lead_rotation")
    .upsert(
      {
        metro_id: metroId,
        last_provider_id: nextProvider.id,
        last_assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "metro_id" }
    );

  if (rotationUpdateError) {
    return { ok: false, assigned: false, message: rotationUpdateError.message };
  }

  const { error: leadUpdateError } = await supabase
    .schema("public")
    .from("leads")
    .update({
      provider_id: nextProvider.id,
      delivery_status: "pending",
      delivery_error: null,
    })
    .eq("id", leadId);

  if (leadUpdateError) {
    return { ok: false, assigned: false, message: leadUpdateError.message };
  }

  await recordLeadEvent({
    leadId,
    actorType,
    actorUserId,
    eventType: "assigned_to_provider",
    data: {
      provider_id: nextProvider.id,
      metro_id: metroId,
      excluded_provider_ids: Array.from(excludeProviders),
    },
  });

  const deliveryResult = await deliverLead(leadId);

  return {
    ok: deliveryResult.ok,
    assigned: true,
    providerId: nextProvider.id,
    message: deliveryResult.message,
  };
}
