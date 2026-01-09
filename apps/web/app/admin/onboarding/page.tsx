import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";

export default function AdminOnboardingPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Onboarding"
        description="Review claim and listing requests before providers go live."
      />
      <Card>
        <CardHeader>
          <CardTitle>Onboarding queue</CardTitle>
          <CardDescription>Requests will appear here once submitted.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No onboarding requests yet.
        </CardContent>
      </Card>
    </div>
  );
}
