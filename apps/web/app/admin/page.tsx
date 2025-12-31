import Link from "next/link";
import { ArrowRight, Inbox, UploadCloud } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Quick links to manage new listings and incoming leads.
          </p>
        </div>
        <Badge variant="secondary">Admin tools</Badge>
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
      </div>
    </div>
  );
}
