"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, User } from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { createBrowserClient } from "../../lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserEmail(user?.email ?? null);
    };

    fetchUser();
  }, []);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    router.replace("/admin");
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    if (!data.session) {
      setStatusMessage("Check your email to confirm your account.");
      return;
    }

    router.replace("/admin");
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <Badge className="w-fit" variant="secondary">
            Admin Access
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Manage Fogforge listings</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Sign in to import providers, review lead delivery, and keep your directory fresh.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Secure access
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Admin-only tools
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/grease-trap-cleaning" className="flex items-center gap-2">
              Browse the directory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Fogforge Admin</CardTitle>
            <CardDescription>Sign in or create an account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {currentUserEmail ? (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                <AlertDescription className="text-emerald-900">
                  Signed in as {currentUserEmail}.
                </AlertDescription>
                <div className="mt-3">
                  <Button asChild size="sm">
                    <Link href="/admin/import/providers">Go to provider import</Link>
                  </Button>
                </div>
              </Alert>
            ) : (
              <p className="text-sm text-muted-foreground">Not signed in.</p>
            )}

            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {statusMessage ? (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <AlertDescription className="text-amber-900">{statusMessage}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={handleSignUp}
                >
                  Create account
                </Button>
              </div>
            </form>

            <Separator />
            <p className="text-xs text-muted-foreground">
              Need access? Contact support to verify your admin account.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
