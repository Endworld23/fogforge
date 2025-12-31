"use server";

import { createServerSupabase } from "../../../lib/supabase/server";

type UpdateResult = {
  ok: boolean;
  message: string;
};

function toText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export async function updateProviderProfileAction(
  _prevState: UpdateResult,
  formData: FormData
): Promise<UpdateResult> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: adminRow } = await supabase
    .schema("public")
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const isAdmin = Boolean(adminRow);

  let providerId = toText(formData.get("providerId"));
  if (!isAdmin) {
    const { data: providerUser } = await supabase
      .schema("public")
      .from("provider_users")
      .select("provider_id")
      .eq("user_id", user.id)
      .maybeSingle();
    providerId = providerUser?.provider_id ?? "";
  }

  if (!providerId) {
    return { ok: false, message: "No provider assigned to this account." };
  }

  const payload = {
    business_name: toText(formData.get("business_name")),
    phone: toText(formData.get("phone")) || null,
    website_url: toText(formData.get("website_url")) || null,
    email_public: toText(formData.get("email_public")) || null,
    description: toText(formData.get("description")) || null,
    street: toText(formData.get("street")) || null,
    city: toText(formData.get("city")),
    state: toText(formData.get("state")),
    postal_code: toText(formData.get("postal_code")) || null,
    is_published: formData.get("is_published") === "on",
  };

  if (!payload.business_name || !payload.city || !payload.state) {
    return { ok: false, message: "Business name, city, and state are required." };
  }

  const { error } = await supabase
    .schema("public")
    .from("providers")
    .update(payload)
    .eq("id", providerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Profile updated." };
}
