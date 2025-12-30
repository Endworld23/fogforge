import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <section>
      <h1>Admin</h1>
      {children}
    </section>
  );
}
