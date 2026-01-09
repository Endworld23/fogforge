import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUserContext } from "../../lib/auth/getUserContext";
import AdminSidebar from "../../components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin } = await getUserContext();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
