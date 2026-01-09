import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { getUserContext } from "../../lib/auth/getUserContext";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, providerUser } = await getUserContext();

  if (!user) {
    redirect("/login");
  }

  if (!providerUser) {
    redirect("/onboarding/status");
  }

  return (
    <main className="relative z-0 mx-auto w-full max-w-6xl px-6 py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Provider Dashboard
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage your listing, review incoming leads, and keep your profile up to date.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">Overview</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/leads">Leads</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/profile">Profile</Link>
          </Button>
          {isAdmin ? (
            <Button asChild size="sm">
              <Link href="/admin">Admin</Link>
            </Button>
          ) : null}
        </div>
        <Separator />
        {children}
      </div>
    </main>
  );
}
