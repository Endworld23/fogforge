import { createServerSupabaseReadOnly } from "../supabase/server";

export type UserContext = {
  user: { id: string; email: string | null } | null;
  isAdmin: boolean;
  providerUser: { provider_id: string } | null;
};

export async function getUserContext(): Promise<UserContext> {
  const supabase = createServerSupabaseReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false, providerUser: null };
  }

  const [{ data: adminRow }, { data: providerUser }] = await Promise.all([
    supabase.schema("public").from("admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase
      .schema("public")
      .from("provider_users")
      .select("provider_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return {
    user: { id: user.id, email: user.email ?? null },
    isAdmin: Boolean(adminRow),
    providerUser: providerUser ?? null,
  };
}
