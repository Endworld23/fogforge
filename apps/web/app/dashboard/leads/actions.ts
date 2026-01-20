"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";

type LeadActionResult = {
  ok: boolean;
  message: string;
};

export async function markLeadViewedProviderAction(leadId: string): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Not authorized." };
  }

  const { data: leadRow, error: leadError } = await supabase
    .schema("public")
    .from("leads")
    .select("provider_id")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    return { ok: false, message: leadError.message };
  }

  if (!leadRow?.provider_id) {
    return { ok: false, message: "Lead not found." };
  }

  const { data: providerUser, error: providerError } = await supabase
    .schema("public")
    .from("provider_users")
    .select("provider_id")
    .eq("user_id", user.id)
    .eq("provider_id", leadRow.provider_id)
    .maybeSingle();

  if (providerError || !providerUser) {
    return { ok: false, message: "Not authorized." };
  }

  const { error: updateError } = await supabase
    .schema("public")
    .from("leads")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("provider_id", leadRow.provider_id)
    .is("viewed_at", null);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath("/dashboard/leads");
  return { ok: true, message: "Lead marked as viewed." };
}
