"use server";

import { headers } from "next/headers";
import { deliverLead } from "../../lib/leads/deliverLead";
import { sendRequesterConfirmation } from "../../lib/leads/sendRequesterConfirmation";
import { getProviderState } from "../../lib/providers/providerState";
import { createServerSupabase } from "../../lib/supabase/server";

type QuoteRequestState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  formError?: string;
};

const PHONE_REQUIRED_MESSAGE =
  "Phone helps us connect you with the fastest available provider. We won’t spam you.";

export async function submitQuoteRequestAction(
  _prevState: QuoteRequestState,
  formData: FormData
): Promise<QuoteRequestState> {
  const firstName = formData.get("first_name");
  const lastName = formData.get("last_name");
  const businessName = formData.get("business_name");
  const addressLine1 = formData.get("address_line1");
  const addressLine2 = formData.get("address_line2");
  const city = formData.get("city");
  const addressState = formData.get("state");
  const postalCode = formData.get("zip");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const message = formData.get("message");
  const metroId = formData.get("metroId");
  const providerId = formData.get("providerId");
  const categoryId = formData.get("categoryId");
  const sourceUrl = formData.get("sourceUrl");
  const honeypot = formData.get("company");

  const fieldErrors: Record<string, string> = {};
  const requiredFields: Array<[string, FormDataEntryValue | null]> = [
    ["first_name", firstName],
    ["last_name", lastName],
    ["business_name", businessName],
    ["email", email],
    ["phone", phone],
    ["address_line1", addressLine1],
    ["city", city],
    ["state", addressState],
    ["zip", postalCode],
    ["metroId", metroId],
    ["categoryId", categoryId],
  ];

  requiredFields.forEach(([field, value]) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      fieldErrors[field] = "This field is required.";
    }
  });

  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return { ok: false, message: "", formError: "Unable to submit your request. Please try again." };
  }

  const phoneDigits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
  if (phoneDigits.length > 0 && phoneDigits.length < 10) {
    fieldErrors.phone = "Please enter a valid 10-digit phone number.";
  }

  if (typeof postalCode === "string" && postalCode.trim().length > 0) {
    const zipValue = postalCode.trim();
    if (!/^\d{5}(-\d{4})?$/.test(zipValue)) {
      fieldErrors.zip = "Please enter a valid ZIP code.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    if (phoneDigits.length > 0 && phoneDigits.length < 10) {
      fieldErrors.phone = "Please enter a valid 10-digit phone number.";
    } else if (fieldErrors.phone) {
      fieldErrors.phone = PHONE_REQUIRED_MESSAGE;
    }
    return { ok: false, message: "", fieldErrors };
  }

  const supabase = await createServerSupabase();
  const headerList = await headers();
  const referer = headerList.get("referer") ?? "";
  const resolvedSourceUrl = typeof sourceUrl === "string" ? sourceUrl : referer;

  const [{ data: metroRow }, { data: categoryRow }] = await Promise.all([
    supabase
      .schema("public")
      .from("metros")
      .select("id, name, state")
      .eq("id", metroId)
      .maybeSingle(),
    supabase.schema("public").from("categories").select("id").eq("id", categoryId).maybeSingle(),
  ]);

  if (!metroRow) {
    return {
      ok: false,
      message: "",
      fieldErrors: {
        metroId: "Please choose your metro so we can connect you to the right provider.",
      },
    };
  }
  if (!categoryRow) {
    return { ok: false, message: "", formError: "Unable to submit your request. Please try again." };
  }

  const resolvedProviderId = typeof providerId === "string" ? providerId : "";
  const firstNameValue = typeof firstName === "string" ? firstName.trim() : "";
  const lastNameValue = typeof lastName === "string" ? lastName.trim() : "";
  const businessNameValue = typeof businessName === "string" ? businessName.trim() : "";
  const emailValue = typeof email === "string" ? email.trim() : "";
  const phoneValue = typeof phone === "string" ? phone.trim() : "";
  const addressLine1Value = typeof addressLine1 === "string" ? addressLine1.trim() : "";
  const addressLine2Value = typeof addressLine2 === "string" ? addressLine2.trim() : "";
  const cityValue = typeof city === "string" ? city.trim() : "";
  const addressStateValue = typeof addressState === "string" ? addressState.trim() : "";
  const postalCodeValue = typeof postalCode === "string" ? postalCode.trim() : "";
  const name = `${firstNameValue} ${lastNameValue}`.trim();

  const { data: providerRow } = resolvedProviderId
    ? await supabase
        .schema("public")
        .from("providers")
        .select(
          "id, business_name, metro_id, category_id, is_published, status, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
        )
        .eq("id", resolvedProviderId)
        .maybeSingle()
    : { data: null };

  if (resolvedProviderId) {
    if (!providerRow || !providerRow.is_published || providerRow.status !== "active") {
      return { ok: false, message: "", formError: "Unable to find that provider." };
    }
    if (providerRow.metro_id !== metroId) {
      return {
        ok: false,
        message: "",
        formError: "Selected metro does not match the provider.",
      };
    }
  }

  const isPooledLead = !resolvedProviderId;
  const addressParts = [
    addressLine1Value,
    addressLine2Value,
    cityValue,
    addressStateValue,
    postalCodeValue,
  ].filter(Boolean);
  const leadPayload = {
    provider_id: resolvedProviderId || null,
    category_id: categoryId,
    metro_id: metroId,
    name,
    email: emailValue,
    phone: phoneValue,
    message: typeof message === "string" && message.trim().length > 0 ? message.trim() : null,
    source_url: resolvedSourceUrl,
    status: "new",
    requester_first_name: firstNameValue,
    requester_last_name: lastNameValue,
    requester_business_name: businessNameValue,
    requester_address: addressParts.length > 0 ? addressParts.join(", ") : null,
  } as const;
  const { data: leadRow, error: leadError } = await supabase
    .schema("public")
    .from("leads")
    .insert(
      isPooledLead
        ? {
            ...leadPayload,
            delivery_status: "pending",
            delivery_error: "Metro pool (awaiting assignment).",
          }
        : leadPayload
    )
    .select("id")
    .maybeSingle();

  if (leadError) {
    return { ok: false, message: "", formError: leadError.message };
  }

  const leadId = leadRow?.id;
  if (!leadId) {
    return { ok: false, message: "", formError: "Unable to submit your request. Please try again." };
  }

  await sendRequesterConfirmation({
    requesterName: name,
    requesterEmail: emailValue,
    metroName: metroRow?.name ?? null,
    metroState: metroRow?.state ?? null,
    providerName: providerRow?.business_name ?? null,
  });

  if (!resolvedProviderId || !providerRow) {
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
