import Link from "next/link";
import { Activity, ArrowRight, Building2, Inbox, UploadCloud } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Overview"
        description="Quick links to manage new listings and incoming leads."
        action={<Badge variant="secondary">Admin tools</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Leads last 7 days</CardTitle>
            <CardDescription>Placeholder until tracking is enabled.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">0</p>
            <div className="mt-4 flex h-16 items-end gap-1">
              {[6, 10, 8, 12, 9, 7, 11].map((height, index) => (
                <div
                  key={`lead-${index}`}
                  className="w-full rounded-sm bg-muted"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">New provider claims</CardTitle>
            <CardDescription>Placeholder until tracking is enabled.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">0</p>
            <div className="mt-4 flex h-16 items-end gap-1">
              {[4, 7, 5, 9, 6, 8, 10].map((height, index) => (
                <div
                  key={`claim-${index}`}
                  className="w-full rounded-sm bg-muted"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UploadCloud className="h-5 w-5 text-primary" />
              Import Providers
            </CardTitle>
            <CardDescription>Upload launch CSVs and review the preview.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/import/providers" className="flex items-center gap-2">
                Go to import
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Inbox className="h-5 w-5 text-primary" />
              Leads Inbox
            </CardTitle>
            <CardDescription>Monitor incoming requests and delivery status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/leads" className="flex items-center gap-2">
                View leads
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Providers
            </CardTitle>
            <CardDescription>Review verified vs unclaimed listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/providers" className="flex items-center gap-2">
                View providers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Activity
            </CardTitle>
            <CardDescription>Monitor platform engagement.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/activity" className="flex items-center gap-2">
                View activity
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
