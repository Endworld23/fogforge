import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { createServerSupabaseReadOnly } from "../../lib/supabase/server";
import { getUserContext } from "../../lib/auth/getUserContext";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { isAdmin, providerUser } = await getUserContext();

  if (!providerUser && isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin access</CardTitle>
          <CardDescription>
            Your account does not have a provider listing assigned yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Assign yourself to a provider in the database to use the provider dashboard.</p>
          <Button asChild>
            <Link href="/admin">Go to admin</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!providerUser) {
    return null;
  }

  const supabase = createServerSupabaseReadOnly();
  const { data: provider } = await supabase
    .schema("public")
    .from("providers")
    .select("business_name, is_published, status, city, state")
    .eq("id", providerUser.provider_id)
    .maybeSingle();

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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{provider.business_name}</CardTitle>
          <CardDescription>
            {provider.city}, {provider.state}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant={provider.is_published ? "secondary" : "outline"}>
              {provider.is_published ? "Published" : "Draft"}
            </Badge>
            <Badge variant="outline">{provider.status}</Badge>
          </div>
          <p>Keep your listing details up to date to improve lead quality.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Manage your listing and leads.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/profile">Edit profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/leads">View leads</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
