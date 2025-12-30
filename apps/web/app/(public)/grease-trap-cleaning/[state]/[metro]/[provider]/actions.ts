"use server";

import { headers } from "next/headers";
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

  const { error } = await supabase.schema("public").from("leads").insert({
    provider_id: providerId,
    category_id: categoryId,
    metro_id: metroId,
    name,
    email,
    phone: typeof phone === "string" && phone.length > 0 ? phone : null,
    message: typeof message === "string" && message.length > 0 ? message : null,
    source_url: resolvedSourceUrl,
    status: "new",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Request received. We'll be in touch soon." };
}
