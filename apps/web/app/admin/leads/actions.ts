"use server";

import { isAdminServer } from "../../../lib/auth/isAdminServer";
import { createServerSupabase } from "../../../lib/supabase/server";

type LeadActionResult = {
  ok: boolean;
  message: string;
};

export async function markLeadSentAction(leadId: string): Promise<LeadActionResult> {
  if (!leadId) {
    return { ok: false, message: "Missing lead id." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .schema("public")
    .from("leads")
    .update({ status: "sent" })
    .eq("id", leadId)
    .eq("status", "new")
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Lead is already updated or unavailable." };
  }

  return { ok: true, message: "Marked as sent." };
}
