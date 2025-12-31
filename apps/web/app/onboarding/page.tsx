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
          Tell us about your business and we will connect you to a provider dashboard account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>We’ll reach out to verify your listing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Email support with your business name, metro, and contact info.</p>
          <p>2. We will create your provider account and send an invite.</p>
          <p>3. Once approved, you can manage your profile and leads.</p>
          <Button asChild className="mt-2">
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
