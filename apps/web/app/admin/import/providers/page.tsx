import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { isAdminServer } from "../../../../lib/auth/isAdminServer";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default async function AdminProviderImportPage() {
  const isAdmin = await isAdminServer();

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Providers</CardTitle>
          <CardDescription>Access denied.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You do not have permission to access this page.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Import Providers"
        description="Upload CSVs to seed launch metros with vetted providers."
        action={
          <Badge className="w-fit" variant="secondary">
            Launch Imports
          </Badge>
        }
      />
      <ImportClient />
    </div>
  );
}
