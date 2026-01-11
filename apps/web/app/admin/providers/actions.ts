"use server";

import { revalidatePath } from "next/cache";
import { isAdminServer } from "../../../lib/auth/isAdminServer";
import { createServerSupabase } from "../../../lib/supabase/server";

type PublishActionResult = {
  ok: boolean;
  message: string;
  is_published?: boolean;
};

export async function updateProviderPublishAction(
  providerId: string,
  isPublished: boolean
): Promise<PublishActionResult> {
  if (!providerId) {
    return { ok: false, message: "Missing provider id." };
  }

  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .schema("public")
    .from("providers")
    .update({ is_published: isPublished })
    .eq("id", providerId)
    .select("id, is_published")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Provider not found." };
  }

  revalidatePath("/admin/providers");

  return { ok: true, message: "Publish status updated.", is_published: data.is_published };
}
