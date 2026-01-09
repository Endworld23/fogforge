import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import { getUserContext } from "../../../lib/auth/getUserContext";

const SUPPORT_EMAIL = "support@YOURDOMAIN.com";

export default async function OnboardingStatusPage() {
  const { user } = await getUserContext();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("onboarding_requests")
    .select("id, type, status, created_at, rejection_reason")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="space-y-3">
        <Badge className="w-fit" variant="secondary">
          Onboarding status
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Your request status
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          We review each request before granting provider access.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            {data ? `Latest request: ${data.type}` : "No request submitted yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {data ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Current status</span>
                <Badge className="text-sm" variant="secondary">
                  {data.status === "pending"
                    ? "Pending review"
                    : data.status === "approved"
                    ? "Approved"
                    : "Rejected"}
                </Badge>
              </div>
              {data.status === "rejected" && data.rejection_reason ? (
                <p>Reason: {data.rejection_reason}</p>
              ) : null}
              {data.status === "approved" ? (
                <Button asChild className="mt-2">
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="mt-2">
                  <Link
                    href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                      "Fogforge onboarding assistance"
                    )}`}
                  >
                    Contact support
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <Button asChild>
              <Link href="/onboarding">Start onboarding</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
