import { redirect } from "next/navigation";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { getUserContext } from "../../lib/auth/getUserContext";
import { getProviderState } from "../../lib/providers/providerState";
import { createServerSupabaseReadOnly } from "../../lib/supabase/server";
import ClaimForm from "./ClaimForm";

type ClaimPageProps = {
  searchParams?: Promise<{ provider?: string }>;
};

export const dynamic = "force-dynamic";

export default async function ClaimPage({ searchParams }: ClaimPageProps) {
  const resolvedParams = await Promise.resolve(searchParams);
  const providerId = resolvedParams?.provider ?? "";

  if (!providerId) {
    redirect("/get-started?mode=claim");
  }

  const { user } = await getUserContext();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/claim?provider=${providerId}`)}`);
  }

  const supabase = await createServerSupabaseReadOnly();
  const { data: provider } = await supabase
    .schema("public")
    .from("providers")
    .select(
      "id, business_name, city, state, status, is_published, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
    )
    .eq("id", providerId)
    .maybeSingle();

  if (!provider || !provider.is_published || provider.status !== "active") {
    redirect("/get-started?mode=claim");
  }

  const providerState = getProviderState(provider);
  const locationLabel = provider.city && provider.state ? `${provider.city}, ${provider.state}` : "";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="space-y-3">
        <Badge className="w-fit" variant="secondary">
          Claim Request
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Claim this business</h1>
        <p className="text-sm text-muted-foreground">
          Request access to manage this listing. We review every claim to keep the directory trusted.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{provider.business_name}</CardTitle>
          <CardDescription>{locationLabel}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {providerState === "UNCLAIMED"
            ? "Submit a claim request and our team will review ownership."
            : "This business already has a claim in progress or has been verified."}
        </CardContent>
      </Card>

      {providerState === "UNCLAIMED" ? (
        <ClaimForm providerId={provider.id} providerName={provider.business_name} />
      ) : null}
    </main>
  );
}
