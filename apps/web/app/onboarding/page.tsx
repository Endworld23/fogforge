import { redirect } from "next/navigation";
import { Badge } from "../../components/ui/badge";
import { createServerSupabaseReadOnly } from "../../lib/supabase/server";
import { getUserContext } from "../../lib/auth/getUserContext";
import OnboardingFlow from "./OnboardingFlow";

type OnboardingPageProps = {
  searchParams?: { mode?: string };
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { user } = await getUserContext();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseReadOnly();
  const [{ data: claimable }, { data: metros }] = await Promise.all([
    supabase
      .schema("public")
      .from("claimable_providers")
      .select("id, business_name, city, state")
      .order("business_name", { ascending: true }),
    supabase
      .schema("public")
      .from("metros")
      .select("id, name, state")
      .order("name", { ascending: true }),
  ]);

  const mode = searchParams?.mode;
  const initialMode = mode === "claim" || mode === "list" ? mode : undefined;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <Badge className="w-fit" variant="secondary">
          Provider Onboarding
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Request access to Fogforge
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Submit your business details and documentation. We review every request.
        </p>
      </div>
      <OnboardingFlow
        claimableProviders={claimable ?? []}
        metros={metros ?? []}
        userEmail={user.email ?? ""}
        initialMode={initialMode}
      />
    </main>
  );
}
