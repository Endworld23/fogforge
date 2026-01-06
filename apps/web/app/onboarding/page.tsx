import Link from "next/link";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <Badge className="w-fit" variant="secondary">
          Provider Onboarding
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">List your business</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Submit your request to claim or list your business.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>
            We’ll verify your information and contact your business.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Email support with your business name, metro, and contact info.</p>
          <p>2. Next steps: we’ll verify your information and contact your business.</p>
          <p>
            3. Once approved, you’ll receive an invite to manage your profile and leads.
          </p>
          <Button asChild className="mt-2">
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
