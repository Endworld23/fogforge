import { createServerSupabaseReadOnly } from "../supabase/server";

export async function isAdminServer() {
  const supabase = createServerSupabaseReadOnly();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const { data, error } = await supabase
    .schema("public")
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}
