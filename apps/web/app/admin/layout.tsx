import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { isAdminServer } from "../../lib/auth/isAdminServer";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const isAdmin = await isAdminServer();

  if (!isAdmin) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Admin
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Fogforge Admin</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage providers, monitor lead delivery, and keep listings fresh.
          </p>
        </div>
        <AdminNav />
        <Separator />
        {children}
      </div>
    </main>
  );
}
