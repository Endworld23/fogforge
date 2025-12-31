import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { MapPin, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Verified local listings
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Find trusted grease trap cleaning pros in your metro
          </h1>
          <p className="text-base text-muted-foreground">
            Compare vetted providers, request quotes in minutes, and keep your kitchen compliant.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm"
              href="/grease-trap-cleaning"
            >
              <Search className="h-4 w-4" />
              Search by metro (ex: Houston)
            </Link>
            <Button asChild>
              <Link href="/grease-trap-cleaning">Browse metros</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Fast quotes
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Verified listings
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Local pros
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/grease-trap-cleaning">Find providers</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">List your business</Link>
            </Button>
          </div>
        </div>
        <Card className="relative overflow-hidden border-border bg-gradient-to-br from-primary/10 via-background to-muted p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Trusted by operators across the region
            </div>
            <div className="grid gap-4">
              <Card className="border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">Metro coverage</p>
                <p className="text-sm text-muted-foreground">10 launch metros, expanding fast.</p>
              </Card>
              <Card className="border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">Response time</p>
                <p className="text-sm text-muted-foreground">Average reply under 2 hours.</p>
              </Card>
              <Card className="border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">Compliance ready</p>
                <p className="text-sm text-muted-foreground">
                  Listings highlight licensed, insured providers.
                </p>
              </Card>
            </div>
          </div>
        </Card>
      </section>

      <Separator />

      <section className="grid gap-6 md:grid-cols-3">
        <Card className="border-border p-5">
          <p className="text-sm font-semibold text-foreground">Request quotes fast</p>
          <p className="text-sm text-muted-foreground">
            Submit one request and hear back from local teams quickly.
          </p>
        </Card>
        <Card className="border-border p-5">
          <p className="text-sm font-semibold text-foreground">Compare confidently</p>
          <p className="text-sm text-muted-foreground">
            See service areas, specialties, and contact options side by side.
          </p>
        </Card>
        <Card className="border-border p-5">
          <p className="text-sm font-semibold text-foreground">Stay compliant</p>
          <p className="text-sm text-muted-foreground">
            Keep your maintenance schedule on track with vetted providers.
          </p>
        </Card>
      </section>
    </main>
  );
}
