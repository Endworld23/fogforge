import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminEmptyState from "../../../components/admin/AdminEmptyState";
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

export default async function ActivityPage() {
  const supabase = await createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("providers")
    .select("id, business_name")
    .order("business_name", { ascending: true })
    .limit(8);

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    provider: row.business_name,
    lastLogin: "Not tracked",
    lastLeadsView: "Not tracked",
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Activity"
        description="Coming soon: real usage insights for provider accounts."
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent provider activity</CardTitle>
          <CardDescription>Placeholder data until tracking is enabled.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <AdminEmptyState
              title="No provider activity yet"
              description="Provider engagement data will appear here once tracked."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead>Last leads view</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.provider}</TableCell>
                    <TableCell>{row.lastLogin}</TableCell>
                    <TableCell>{row.lastLeadsView}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Coming soon</Badge>
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
