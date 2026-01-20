"use server";

import { Resend } from "resend";
import { createServerSupabase } from "../supabase/server";

type DeliverLeadResult = {
  ok: boolean;
  message: string;
};

type LeadDetails = {
  id: string;
  provider_id: string;
  metro_id: string | null;
  category_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source_url: string | null;
  created_at: string;
};

const MAX_ERROR_LENGTH = 500;

function trimErrorMessage(message: string) {
  return message.length > MAX_ERROR_LENGTH ? `${message.slice(0, MAX_ERROR_LENGTH)}...` : message;
}

export async function deliverLead(leadId: string): Promise<DeliverLeadResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const supabase = await createServerSupabase();
  const { data: leadRow, error: leadError } = await supabase
    .schema("public")
    .from("leads")
    .select(
      "id, provider_id, metro_id, category_id, name, email, phone, message, source_url, created_at"
    )
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    return { ok: false, message: leadError.message };
  }
  if (!leadRow) {
    return { ok: false, message: "Lead not found." };
  }

  const lead = leadRow as LeadDetails;
  const [{ data: providerRow, error: providerError }, { data: metroRow }, { data: categoryRow }] =
    await Promise.all([
      supabase
        .schema("public")
        .from("providers")
        .select("id, business_name, email_public")
        .eq("id", lead.provider_id)
        .maybeSingle(),
      lead.metro_id
        ? supabase.schema("public").from("metros").select("name").eq("id", lead.metro_id).maybeSingle()
        : Promise.resolve({ data: null }),
      lead.category_id
        ? supabase
            .schema("public")
            .from("categories")
            .select("name")
            .eq("id", lead.category_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  if (providerError) {
    const errorMessage = trimErrorMessage(providerError.message);
    await supabase
      .schema("public")
      .from("leads")
      .update({
        delivery_status: "failed",
        delivered_at: null,
        delivery_error: errorMessage,
      })
      .eq("id", leadId);
    return { ok: false, message: errorMessage };
  }
  if (!providerRow) {
    const missingMessage = "Provider not found for lead.";
    await supabase
      .schema("public")
      .from("leads")
      .update({
        delivery_status: "failed",
        delivered_at: null,
        delivery_error: missingMessage,
      })
      .eq("id", leadId);
    return { ok: false, message: missingMessage };
  }

  const providerEmail = providerRow.email_public?.trim() ?? "";
  const fallbackEmail = process.env.LEADS_FALLBACK_EMAIL?.trim() ?? "";
  const recipientEmail = providerEmail || fallbackEmail;
  const bccEmail = process.env.LEADS_BCC_EMAIL?.trim() ?? "";
  const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const fromEmail = process.env.LEADS_FROM_EMAIL?.trim() ?? "";

  if (!recipientEmail) {
    const missingMessage = "No delivery email available for this provider.";
    await supabase
      .schema("public")
      .from("leads")
      .update({
        delivery_status: "failed",
        delivered_at: null,
        delivery_error: missingMessage,
      })
      .eq("id", leadId);
    return { ok: false, message: missingMessage };
  }

  if (!resendApiKey || !fromEmail) {
    const configMessage = "Missing Resend configuration.";
    await supabase
      .schema("public")
      .from("leads")
      .update({
        delivery_status: "failed",
        delivered_at: null,
        delivery_error: configMessage,
      })
      .eq("id", leadId);
    return { ok: false, message: configMessage };
  }

  const providerName = providerRow.business_name ?? "Provider";
  const metroLabel = metroRow?.name ?? "Unknown metro";
  const categoryLabel = categoryRow?.name ?? "Service";
  const subject = `New quote request: ${providerName} (${metroLabel})`;
  const bodyLines = [
    `Provider: ${providerName}`,
    `Category: ${categoryLabel}`,
    `Metro: ${metroLabel}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone ?? "N/A"}`,
    `Message: ${lead.message ?? "N/A"}`,
    `Source URL: ${lead.source_url ?? "N/A"}`,
    `Submitted: ${new Date(lead.created_at).toLocaleString()}`,
  ];
  const bccRecipient = bccEmail && bccEmail !== recipientEmail ? bccEmail : undefined;

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      bcc: bccRecipient,
      subject,
      text: bodyLines.join("\n"),
      replyTo: lead.email,
    });
  } catch (error) {
    const failureMessage =
      error instanceof Error ? trimErrorMessage(error.message) : "Email delivery failed.";
    await supabase
      .schema("public")
      .from("leads")
      .update({
        delivery_status: "failed",
        delivered_at: null,
        delivery_error: failureMessage,
      })
      .eq("id", leadId);
    return { ok: false, message: failureMessage };
  }

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({
      delivery_status: "delivered",
      delivered_at: new Date().toISOString(),
      delivery_error: null,
    })
    .eq("id", leadId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  return { ok: true, message: "Lead delivered via email." };
}
