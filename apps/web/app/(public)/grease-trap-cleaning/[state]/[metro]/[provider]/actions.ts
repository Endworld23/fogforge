"use server";

import { headers } from "next/headers";
import { createHash } from "crypto";
import { deliverLead } from "../../../../../../lib/leads/deliverLead";
import { validateEmail, validatePhone } from "../../../../../../lib/leads/leadValidation";
import { recordLeadEvent } from "../../../../../../lib/leads/recordLeadEvent";
import { sendRequesterConfirmation } from "../../../../../../lib/leads/sendRequesterConfirmation";
import { getProviderState } from "../../../../../../lib/providers/providerState";
import { createServerSupabase } from "../../../../../../lib/supabase/server";

type LeadFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  formError?: string;
};

const MAX_ATTEMPTS_PER_DAY = 10;

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
  const phoneNotice =
    "Phone helps us connect you with the fastest available provider. We won’t spam you.";
  const fieldErrors: Record<string, string> = {};
  const phoneValue = typeof phone === "string" ? phone.trim() : "";

  if (
    typeof providerId !== "string" ||
    typeof categoryId !== "string" ||
    typeof metroId !== "string" ||
    typeof name !== "string" ||
    typeof email !== "string"
  ) {
    return { ok: false, message: "", formError: "Missing required fields." };
  }
  if (name.trim().length === 0) {
    fieldErrors.name = "This field is required.";
  }
  const emailError = validateEmail(email);
  if (emailError) {
    fieldErrors.email = emailError;
  }
  const phoneError = validatePhone(phoneValue, phoneNotice);
  if (phoneError) {
    fieldErrors.phone = phoneError;
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "", fieldErrors };
  }
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return { ok: false, message: "", formError: "Unable to submit your request. Please try again." };
  }
  const startedAtMs =
    typeof formStartedAt === "string" ? Number.parseInt(formStartedAt, 10) : 0;
  if (Number.isFinite(startedAtMs) && startedAtMs > 0) {
    const elapsedMs = Date.now() - startedAtMs;
    if (elapsedMs < 1500) {
      return { ok: false, message: "", formError: "Please take a moment and try again." };
    }
  }

  const supabase = await createServerSupabase();
  const headerList = await headers();
  const referer = headerList.get("referer") ?? "";
  const resolvedSourceUrl = typeof sourceUrl === "string" ? sourceUrl : referer;

  const forwardedFor = headerList.get("x-forwarded-for") ?? "";
  const ipAddress =
    forwardedFor.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const ipHash = createHash("sha256").update(ipAddress).digest("hex");
  const attemptDate = new Date().toISOString().slice(0, 10);
  const { data: attemptCount, error: attemptError } = await supabase.rpc(
    "record_lead_submit_attempt",
    {
      p_ip_hash: ipHash,
      p_attempt_date: attemptDate,
    }
  );

  if (attemptError) {
    return { ok: false, message: "", formError: "Unable to submit your request. Please try again." };
  }

  if (typeof attemptCount === "number" && attemptCount > MAX_ATTEMPTS_PER_DAY) {
    return {
      ok: false,
      message: "",
      formError: "We’ve received too many requests from this device today. Please try again later.",
    };
  }

  const { data: leadRow, error } = await supabase
    .schema("public")
    .from("leads")
    .insert({
      provider_id: providerId,
      category_id: categoryId,
      metro_id: metroId,
      name,
      email,
      phone: phoneValue,
      message: typeof message === "string" && message.length > 0 ? message : null,
      source_url: resolvedSourceUrl,
      status: "new",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "", formError: error.message };
  }

  const leadId = leadRow?.id;
  if (!leadId) {
    return { ok: false, message: "", formError: "Unable to create your request. Please try again." };
  }

  await recordLeadEvent({
    leadId,
    actorType: "public",
    eventType: "lead_created",
    data: {
      metro_id: metroId,
      provider_id: providerId,
      category_id: categoryId,
      source_url: resolvedSourceUrl,
    },
  });

  await recordLeadEvent({
    leadId,
    actorType: "system",
    eventType: "assigned_to_provider",
    data: { provider_id: providerId, metro_id: metroId },
  });

  const { data: metroRow } = await supabase
    .schema("public")
    .from("metros")
    .select("name, state")
    .eq("id", metroId)
    .maybeSingle();

  const { data: providerRow } = await supabase
    .schema("public")
    .from("providers")
    .select("id, email_public, business_name, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id")
    .eq("id", providerId)
    .maybeSingle();

  await sendRequesterConfirmation({
    requesterName: name,
    requesterEmail: email,
    metroName: metroRow?.name ?? null,
    metroState: metroRow?.state ?? null,
    providerName: providerRow?.business_name ?? null,
  });

  if (!providerRow) {
    await supabase
      .schema("public")
      .from("leads")
      .update({
        delivery_status: "failed",
        delivered_at: null,
        delivery_error: "Provider not found for delivery.",
      })
      .eq("id", leadId);
    await recordLeadEvent({
      leadId,
      actorType: "system",
      eventType: "delivery_failed",
      data: { reason: "Provider not found for delivery.", provider_id: providerId },
    });
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
        delivery_status: "skipped",
        delivered_at: null,
        delivery_error: reason,
      })
      .eq("id", leadId);
    await recordLeadEvent({
      leadId,
      actorType: "system",
      eventType: "delivery_skipped",
      data: { reason, provider_id: providerId },
    });
  }

  return { ok: true, message: "Request received. We'll be in touch soon." };
}
