import { isAdminServer } from "../../../../lib/auth/isAdminServer";
import ImportClient from "./ImportClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";

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
      <div className="space-y-2">
        <Badge className="w-fit" variant="secondary">
          Launch Imports
        </Badge>
        <h2 className="text-2xl font-semibold text-foreground">Import Providers</h2>
        <p className="text-sm text-muted-foreground">
          Upload CSVs to seed launch metros with vetted providers.
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
