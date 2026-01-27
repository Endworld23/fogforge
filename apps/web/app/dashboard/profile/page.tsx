import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { getUserContext } from "../../../lib/auth/getUserContext";
import { getProviderState } from "../../../lib/providers/providerState";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";
import ProfileForm from "./ProfileForm";
import ProviderMediaManager from "./ProviderMediaManager";

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage() {
  const { isAdmin, providerUser } = await getUserContext();

  if (!providerUser && isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider profile</CardTitle>
          <CardDescription>No provider assigned to this admin account.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Assign a provider to test the dashboard profile view.{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/admin">
            Go to admin
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!providerUser) {
    return null;
  }

  const supabase = await createServerSupabaseReadOnly();
  const [{ data: provider }, { data: media }] = await Promise.all([
    supabase
      .schema("public")
      .from("providers")
      .select(
        "id, business_name, phone, website_url, email_public, description, street, city, state, postal_code, is_published, logo_path, logo_url, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id"
      )
      .eq("id", providerUser.provider_id)
      .maybeSingle(),
    supabase
      .schema("public")
      .from("provider_media")
      .select("id, url, sort_order, created_at")
      .eq("provider_id", providerUser.provider_id)
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (!provider) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider not found</CardTitle>
          <CardDescription>We could not load your provider profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const providerState = getProviderState(provider);
  const canEditMedia = providerState !== "UNCLAIMED";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your listing details.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm provider={provider} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
          <CardDescription>Upload a logo and gallery photos for your public listing.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderMediaManager
            providerId={provider.id}
            initialLogoUrl={provider.logo_url ?? null}
            initialLogoPath={provider.logo_path ?? null}
            initialMedia={(media ?? []).map((item) => ({
              id: item.id,
              url: item.url,
              sort_order: item.sort_order ?? 0,
            }))}
            canEditMedia={canEditMedia}
            providerState={providerState}
            isPublished={provider.is_published}
          />
        </CardContent>
      </Card>
    </div>
  );
}
