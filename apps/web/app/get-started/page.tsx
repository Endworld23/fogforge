"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { createBrowserClient } from "../../lib/supabase/browser";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type FlowType = "claim" | "list" | null;
type AuthMode = "signup" | "signin";

type GetStartedPageProps = {
  searchParams?: Promise<{ mode?: string }>;
};

export default function GetStartedPage({ searchParams }: GetStartedPageProps) {
  const [step, setStep] = useState(0);
  const [flowType, setFlowType] = useState<FlowType>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const initialApplied = useRef(false);

  useEffect(() => {
    if (initialApplied.current) return;
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(searchParams);
      const modeParam = resolvedParams?.mode;
      if (modeParam === "claim" || modeParam === "list") {
        setFlowType(modeParam);
        setStep(1);
        initialApplied.current = true;
      }
    };
    void resolveParams();
  }, [searchParams]);

  const handleChooseFlow = (type: Exclude<FlowType, null>) => {
    setFlowType(type);
    setStep(1);
    setStatusMessage(null);
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((current) => Math.max(0, current - 1));
    setStatusMessage(null);
    setVerificationSent(false);
  };

  const validateAuthInputs = () => {
    if (!EMAIL_REGEX.test(email)) {
      setStatusMessage("Enter a valid email address.");
      return false;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatusMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return false;
    }
    return true;
  };

  const normalizeAuthError = (message: string | undefined) => {
    if (!message) return "Unable to authenticate. Please try again.";
    if (message.toLowerCase().includes("anonymous sign-ins are disabled")) {
      return "Account creation is currently disabled. Please contact support.";
    }
    return message;
  };

  const isValidEmail = EMAIL_REGEX.test(email);
  const isValidPassword = password.length >= MIN_PASSWORD_LENGTH;
  const canSubmit = isValidEmail && isValidPassword && !isLoading;

  const handleAuth = async () => {
    if (!flowType) {
      setStatusMessage("Choose claim or list to continue.");
      return;
    }
    if (!validateAuthInputs()) return;

    setIsLoading(true);
    setStatusMessage(null);

    const supabase = createBrowserClient();
    if (authMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setIsLoading(false);
      if (error) {
        setStatusMessage(normalizeAuthError(error.message));
        return;
      }
      window.location.assign(`/onboarding?mode=${flowType}`);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setIsLoading(false);
    if (error) {
      setStatusMessage(normalizeAuthError(error.message));
      return;
    }

    if (!data.session) {
      setVerificationSent(true);
      setStatusMessage("Check your email to confirm your account, then sign in to continue.");
      return;
    }

    window.location.assign(`/onboarding?mode=${flowType}`);
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <Badge className="w-fit" variant="secondary">
          Get started
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Claim or list your business
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Start your onboarding request and we’ll review your submission.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Step {step + 1}</CardTitle>
          <CardDescription>
            {step === 0 ? "Choose how you want to get listed." : "Create an account or sign in."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Claim your business</CardTitle>
                  <CardDescription>Already listed? Claim your profile to manage leads.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" onClick={() => handleChooseFlow("claim")}>
                    Claim a listing
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>List your business</CardTitle>
                  <CardDescription>Submit a new listing request with your details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline" onClick={() => handleChooseFlow("list")}>
                    Request a new listing
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {flowType ? (
                <p className="text-xs text-muted-foreground">
                  You selected: {flowType === "claim" ? "Claim" : "List"}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={authMode === "signup" ? "default" : "outline"}
                  onClick={() => setAuthMode("signup")}
                >
                  Create account
                </Button>
                <Button
                  type="button"
                  variant={authMode === "signin" ? "default" : "outline"}
                  onClick={() => setAuthMode("signin")}
                >
                  Sign in
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
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
                  type="password"
                  autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>

              {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}

              {verificationSent ? (
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/login">Go to sign in</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={flowType ? `/get-started?mode=${flowType}` : "/get-started"}>
                      Back to get started
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button type="button" onClick={handleAuth} disabled={!canSubmit}>
                  {isLoading
                    ? authMode === "signin"
                      ? "Signing in..."
                      : "Creating account..."
                    : authMode === "signin"
                    ? "Sign in"
                    : "Create account"}
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-between">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            ) : (
              <span />
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
