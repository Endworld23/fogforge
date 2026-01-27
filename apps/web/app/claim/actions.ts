"use server";

import { createServerSupabase } from "../../lib/supabase/server";
import { getProviderState } from "../../lib/providers/providerState";
import { sendClaimNotification } from "../../lib/claims/sendClaimNotification";

type ClaimActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

type ClaimDocPayload = {
  docType: string;
  filePath: string;
  fileUrl: string;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ZIP_REGEX = /^\d{5}(?:-\d{4})?$/;

function toText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function submitProviderClaimAction(
  _prevState: ClaimActionResult,
  formData: FormData
): Promise<ClaimActionResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please sign in to continue." };
  }

  const providerId = toText(formData.get("providerId"));
  const claimRequestId = toText(formData.get("claimRequestId"));
  const message = toText(formData.get("message"));
  const claimantFirstName = toText(formData.get("claimant_first_name"));
  const claimantLastName = toText(formData.get("claimant_last_name"));
  const claimantPhone = toText(formData.get("claimant_phone"));
  const claimantRole = toText(formData.get("claimant_role"));
  const claimantRoleOther = toText(formData.get("claimant_role_other"));
  const claimantAddress1 = toText(formData.get("claimant_address_line1"));
  const claimantAddress2 = toText(formData.get("claimant_address_line2"));
  const claimantCity = toText(formData.get("claimant_city"));
  const claimantState = toText(formData.get("claimant_state"));
  const claimantZip = toText(formData.get("claimant_zip"));
  const docsRaw = toText(formData.get("documents"));

  const fieldErrors: Record<string, string> = {};

  if (!UUID_REGEX.test(providerId)) {
    fieldErrors.providerId = "Invalid provider selected.";
  }
  if (!UUID_REGEX.test(claimRequestId)) {
    fieldErrors.claimRequestId = "Unable to prepare claim request.";
  }
  if (!claimantFirstName) fieldErrors.claimant_first_name = "First name is required.";
  if (!claimantLastName) fieldErrors.claimant_last_name = "Last name is required.";
  if (!claimantPhone) fieldErrors.claimant_phone = "Phone is required.";
  if (!claimantRole) fieldErrors.claimant_role = "Role is required.";
  if (claimantRole === "Other" && !claimantRoleOther) {
    fieldErrors.claimant_role_other = "Please specify your role.";
  }
  if (!claimantAddress1) fieldErrors.claimant_address_line1 = "Address line 1 is required.";
  if (!claimantCity) fieldErrors.claimant_city = "City is required.";
  if (!claimantState) fieldErrors.claimant_state = "State is required.";
  if (!claimantZip) fieldErrors.claimant_zip = "ZIP is required.";

  const normalizedPhone = normalizePhone(claimantPhone);
  if (claimantPhone && normalizedPhone.length < 10) {
    fieldErrors.claimant_phone = "Please enter a valid 10-digit phone number.";
  }

  if (claimantZip && !ZIP_REGEX.test(claimantZip)) {
    fieldErrors.claimant_zip = "Please enter a valid ZIP code.";
  }

  let documents: ClaimDocPayload[] = [];
  if (docsRaw) {
    try {
      documents = JSON.parse(docsRaw);
    } catch {
      fieldErrors.documents = "We could not read your documents. Please retry.";
    }
  }

  if (!Array.isArray(documents) || documents.length < 2) {
    fieldErrors.documents = "Please upload at least two verification documents.";
  } else {
    const invalid = documents.some((doc) => !doc.docType || !doc.filePath || !doc.fileUrl);
    if (invalid) {
      fieldErrors.documents = "Each document must include a type and file.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const { data: provider } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, business_name, is_published, status, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
    )
    .eq("id", providerId)
    .maybeSingle();

  if (!provider || !provider.is_published || provider.status !== "active") {
    return { ok: false, message: "This business is not available for claim." };
  }

  if (getProviderState(provider) !== "UNCLAIMED") {
    return { ok: false, message: "This business has already been claimed." };
  }

  const { data: existing } = await supabase
    .schema("public")
    .from("provider_claim_requests")
    .select("id")
    .eq("provider_id", providerId)
    .eq("requester_user_id", user.id)
    .eq("status", "PENDING")
    .maybeSingle();

  if (existing) {
    return { ok: false, message: "A claim request is already pending for this business." };
  }

  const { error: insertError } = await supabase
    .schema("public")
    .from("provider_claim_requests")
    .insert({
      id: claimRequestId,
      provider_id: providerId,
      requester_user_id: user.id,
      requester_email: user.email ?? null,
      status: "PENDING",
      message: message || null,
      claimant_first_name: claimantFirstName,
      claimant_last_name: claimantLastName,
      claimant_phone: claimantPhone,
      claimant_role: claimantRole,
      claimant_role_other: claimantRole === "Other" ? claimantRoleOther : null,
      claimant_address_line1: claimantAddress1,
      claimant_address_line2: claimantAddress2 || null,
      claimant_city: claimantCity,
      claimant_state: claimantState,
      claimant_zip: claimantZip,
    });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  const { error: docError } = await supabase
    .schema("public")
    .from("provider_claim_request_documents")
    .insert(
      documents.map((doc) => ({
        claim_request_id: claimRequestId,
        doc_type: doc.docType,
        file_path: doc.filePath,
        file_url: doc.fileUrl,
      }))
    );

  if (docError) {
    return { ok: false, message: docError.message };
  }

  if (user.email) {
    await sendClaimNotification({
      requesterEmail: user.email,
      requesterName: user.user_metadata?.full_name ?? null,
      providerName: provider.business_name ?? "this business",
      status: "submitted",
    });
  }

  return { ok: true, message: "Claim request submitted." };
}
