"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
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

  if (
    typeof providerId !== "string" ||
    typeof categoryId !== "string" ||
    typeof metroId !== "string" ||
    typeof name !== "string" ||
    typeof email !== "string"
  ) {
    return { ok: false, message: "Missing required fields." };
  }

  const supabase = createServerSupabase();
  const referer = headers().get("referer") ?? "";
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
  const { data: providerRow } = await supabase
    .schema("public")
    .from("providers")
    .select("email_public, business_name")
    .eq("id", providerId)
    .maybeSingle();

  const providerEmail = providerRow?.email_public ?? null;
  const providerName = providerRow?.business_name ?? "Provider";
  let deliveryStatus: "sent" | "failed" = "failed";
  let deliveryError = "Provider has no public email";

  if (providerEmail && leadId) {
    const resendApiKey = process.env.RESEND_API_KEY ?? "";
    const fromEmail = process.env.LEADS_FROM_EMAIL ?? "";
    const bccEmail = process.env.LEADS_BCC_EMAIL ?? "";

    if (!resendApiKey || !fromEmail) {
      deliveryError = "Missing Resend configuration";
    } else {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: fromEmail,
          to: providerEmail,
          bcc: bccEmail ? [bccEmail] : undefined,
          subject: `New lead for ${providerName}`,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${typeof phone === "string" && phone.length > 0 ? phone : "N/A"}`,
            `Message: ${typeof message === "string" && message.length > 0 ? message : "N/A"}`,
            `Source: ${resolvedSourceUrl || "N/A"}`,
          ].join("\n"),
        });
        deliveryStatus = "sent";
        deliveryError = "";
      } catch (deliveryException) {
        deliveryStatus = "failed";
        deliveryError =
          deliveryException instanceof Error
            ? deliveryException.message
            : "Resend delivery failed";
      }
    }
  }

  if (leadId) {
    await supabase.schema("public").from("lead_deliveries").insert({
      lead_id: leadId,
      provider_id: providerId,
      method: "email",
      status: deliveryStatus,
      error: deliveryError || null,
    });
  }

  return { ok: true, message: "Request received. We'll be in touch soon." };
}
