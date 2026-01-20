"use server";

import { headers } from "next/headers";
import { deliverLead } from "../../../../../../lib/leads/deliverLead";
import { getProviderState } from "../../../../../../lib/providers/providerState";
import { createServerSupabase } from "../../../../../../lib/supabase/server";

type LeadFormState = {
  ok: boolean;
  message: string;
};

export async function submitLeadAction(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const providerId = formData.get("providerId");
  const categoryId = formData.get("categoryId");
  const metroId = formData.get("metroId");
  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const message = formData.get("message");
  const sourceUrl = formData.get("sourceUrl");
  const honeypot = formData.get("company");
  const formStartedAt = formData.get("formStartedAt");

  if (
    typeof providerId !== "string" ||
    typeof categoryId !== "string" ||
    typeof metroId !== "string" ||
    typeof name !== "string" ||
    typeof email !== "string"
  ) {
    return { ok: false, message: "Missing required fields." };
  }
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return { ok: false, message: "Unable to submit your request. Please try again." };
  }
  const startedAtMs =
    typeof formStartedAt === "string" ? Number.parseInt(formStartedAt, 10) : 0;
  if (Number.isFinite(startedAtMs) && startedAtMs > 0) {
    const elapsedMs = Date.now() - startedAtMs;
    if (elapsedMs < 1500) {
      return { ok: false, message: "Please take a moment and try again." };
    }
  }

  const supabase = await createServerSupabase();
  const headerList = await headers();
  const referer = headerList.get("referer") ?? "";
  const resolvedSourceUrl = typeof sourceUrl === "string" ? sourceUrl : referer;

  const { data: leadRow, error } = await supabase
    .schema("public")
    .from("leads")
    .insert({
      provider_id: providerId,
      category_id: categoryId,
      metro_id: metroId,
      name,
      email,
      phone: typeof phone === "string" && phone.length > 0 ? phone : null,
      message: typeof message === "string" && message.length > 0 ? message : null,
      source_url: resolvedSourceUrl,
      status: "new",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  const leadId = leadRow?.id;
  if (!leadId) {
    return { ok: false, message: "Unable to create your request. Please try again." };
  }

  const { data: providerRow } = await supabase
    .schema("public")
    .from("providers")
    .select("id, email_public, business_name, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id")
    .eq("id", providerId)
    .maybeSingle();

  if (!providerRow) {
    await supabase
      .schema("public")
      .from("leads")
      .update({
        delivery_status: "pending",
        delivered_at: null,
        delivery_error: "Provider not found for delivery.",
      })
      .eq("id", leadId);
    return { ok: true, message: "Request received. We'll be in touch soon." };
  }

  const providerState = getProviderState(providerRow);
  if (providerState === "VERIFIED") {
    await deliverLead(leadId);
  } else {
    const reason =
      providerState === "CLAIMED_UNVERIFIED"
        ? "Verification required."
        : "Provider unclaimed (escrow).";
    await supabase
      .schema("public")
      .from("leads")
      .update({
        delivery_status: "pending",
        delivered_at: null,
        delivery_error: reason,
      })
      .eq("id", leadId);
  }

  return { ok: true, message: "Request received. We'll be in touch soon." };
}
