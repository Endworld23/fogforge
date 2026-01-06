import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";

const HERO_TITLE = "Get more local leads for grease trap cleaning";
const HERO_SUBTITLE =
  "Build trust with verified listings and turn search traffic into inbound calls.";
const HERO_BULLETS = ["More visibility in your metro", "Trust signals for buyers", "Inbound leads to your inbox"];

const HOW_IT_WORKS = [
  "Claim or list your business profile.",
  "We verify your details and publish your listing.",
  "Start receiving local requests and quotes.",
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    description: "Basic presence to validate demand.",
    features: ["Listing profile", "Basic search visibility", "Lead notifications"],
  },
  {
    name: "Low",
    price: "$49/mo",
    description: "Best for new operators testing the channel.",
    features: ["Everything in Free", "Priority placement", "Email support", "Monthly reporting"],
  },
  {
    name: "Medium",
    price: "$99/mo",
    description: "Balanced growth plan for busy metros.",
    features: ["Everything in Low", "Featured badge", "Lead routing", "Quarterly optimization"],
    recommended: true,
  },
  {
    name: "High",
    price: "$199/mo",
    description: "Maximize coverage across multiple metros.",
    features: ["Everything in Medium", "Multi-location support", "Dedicated success contact", "Custom reporting"],
  },
];

const FAQS = [
  {
    question: "How do I claim an existing listing?",
    answer:
      "Choose “Claim your business” and we’ll verify ownership before granting dashboard access.",
  },
  {
    question: "How long does approval take?",
    answer: "Most listings are reviewed within 2–3 business days.",
  },
  {
    question: "Can I change plans later?",
    answer: "Yes. Plans can be upgraded or downgraded once billing is enabled.",
  },
];

export const metadata: Metadata = {
  title: "Get Started | Fogforge",
  description:
    "Claim or list your grease trap cleaning business on Fogforge. Preview pricing tiers and learn how listings work.",
};

export default function GetStartedPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <Badge className="w-fit" variant="secondary">
            Provider growth
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{HERO_TITLE}</h1>
          <p className="text-base text-muted-foreground">{HERO_SUBTITLE}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {HERO_BULLETS.map((bullet) => (
              <li key={bullet}>• {bullet}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/onboarding?mode=claim">Claim your business</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/onboarding?mode=list">List your business</Link>
            </Button>
          </div>
        </div>
        <Card className="border-border bg-muted/40">
          <CardHeader>
            <CardTitle>Why Fogforge</CardTitle>
            <CardDescription>Local operators discover you when they need service fast.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Verified listings signal compliance and reliability.</p>
            <p>• Metro-focused pages match how buyers search.</p>
            <p>• You control your availability and contact info.</p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <p className="text-sm text-muted-foreground">Simple steps to get listed and start receiving leads.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, index) => (
            <Card key={step} className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Step {index + 1}</CardTitle>
                <CardDescription>{step}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Pricing preview</h2>
          <p className="text-sm text-muted-foreground">
            Placeholder tiers to help you plan. Final pricing will be announced before launch.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PRICING_TIERS.map((tier) => (
            <Card key={tier.name} className="border-border">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  {tier.recommended ? (
                    <Badge variant="secondary">Recommended</Badge>
                  ) : null}
                </div>
                <CardDescription>{tier.description}</CardDescription>
                <div className="text-2xl font-semibold text-foreground">{tier.price}</div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {tier.features.map((feature) => (
                  <p key={feature}>• {feature}</p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
          <p className="text-sm text-muted-foreground">Quick answers for providers getting started.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {FAQS.map((faq) => (
            <Card key={faq.question} className="border-border">
              <CardHeader>
                <CardTitle className="text-base">{faq.question}</CardTitle>
                <CardDescription>{faq.answer}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Ready to get started?</h2>
          <p className="text-sm text-muted-foreground">Claim your profile or list a new business in minutes.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/onboarding?mode=claim">Claim your business</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/onboarding?mode=list">List your business</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
