import Link from "next/link";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";

type ProviderRow = {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  is_published: boolean;
  provider_users: { user_id: string }[] | null;
};

export default async function AdminProvidersPage() {
  const supabase = createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("providers")
    .select("id, business_name, slug, status, is_published, provider_users(user_id)")
    .order("business_name", { ascending: true });

  const providers = (data ?? []).map((row) => ({
    id: row.id,
    business_name: row.business_name,
    slug: row.slug,
    status: row.status,
    is_published: row.is_published,
    provider_users: row.provider_users ?? null,
    isVerified: (row.provider_users ?? []).length > 0,
  }));

  const verifiedCount = providers.filter((provider) => provider.isVerified).length;
  const unclaimedCount = providers.length - verifiedCount;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Providers"
        description="Track verified providers and follow up with unclaimed listings."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verified providers</CardTitle>
            <CardDescription>Linked to a user account.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{verifiedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unclaimed providers</CardTitle>
            <CardDescription>Listings without a user account.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{unclaimedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All providers</CardTitle>
          <CardDescription>Click a provider to view details.</CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No providers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publish</TableHead>
                  <TableHead>Account</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/providers/${provider.slug}`}
                        className="text-foreground hover:underline"
                      >
                        {provider.business_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={provider.is_published ? "secondary" : "outline"}>
                        {provider.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={provider.isVerified ? "secondary" : "outline"}>
                        {provider.isVerified ? "Verified" : "Unclaimed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
