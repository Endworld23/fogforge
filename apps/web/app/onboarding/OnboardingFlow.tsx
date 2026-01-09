"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { createBrowserClient } from "../../lib/supabase/browser";

type ProviderOption = {
  id: string;
  business_name: string;
  city: string;
  state: string;
};

type MetroOption = {
  id: string;
  name: string;
  state: string;
};

type OnboardingFlowProps = {
  claimableProviders: ProviderOption[];
  metros: MetroOption[];
  userEmail: string;
  initialMode?: "claim" | "list";
};

type FlowType = "claim" | "list" | null;

const TOTAL_STEPS = 4;

export default function OnboardingFlow({
  claimableProviders,
  metros,
  userEmail,
  initialMode,
}: OnboardingFlowProps) {
  const [flowType, setFlowType] = useState<FlowType>(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [metroId, setMetroId] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const initialApplied = useRef(false);

  useEffect(() => {
    if (initialApplied.current) return;
    if (step === 0 && flowType === null && initialMode) {
      setFlowType(initialMode);
      setStep(1);
      initialApplied.current = true;
    }
  }, [flowType, initialMode, step]);

  const progress = useMemo(() => ((step + 1) / TOTAL_STEPS) * 100, [step]);

  const getFriendlyStatus = (message?: string | null) => {
    if (!message) return "Unable to submit request.";
    const normalized = message.toLowerCase();
    if (normalized.includes("already claimed")) {
      return "This business has already been claimed. Please choose another listing.";
    }
    if (normalized.includes("pending claim")) {
      return "A claim request is already pending for this business.";
    }
    return message;
  };

  const resetStatus = () => setStatus(null);

  const handleChooseFlow = (type: Exclude<FlowType, null>) => {
    setFlowType(type);
    setStep(1);
    resetStatus();
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((current) => Math.max(0, current - 1));
    if (step === 1) {
      setFlowType(null);
    }
    resetStatus();
  };

  const validateStep = () => {
    if (step === 1) {
      if (flowType === "claim" && !businessId) {
        setStatus("Select a business to claim.");
        return false;
      }
      if (flowType === "list") {
        if (!businessName || !street || !city || !stateValue || !postalCode || !metroId) {
          setStatus("Provide business name, street, city, state, postal code, and metro.");
          return false;
        }
      }
    }

    if (step === 2) {
      if (!email) {
        setStatus("Email is required.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
    resetStatus();
  };

  const handleSubmit = async () => {
    if (!flowType) return;
    if (!validateStep()) return;
    setIsSubmitting(true);
    setStatus(null);

    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("Please sign in to continue.");
        setIsSubmitting(false);
        return;
      }

      const { data: request, error } = await supabase
        .schema("public")
        .from("onboarding_requests")
        .insert({
          user_id: user.id,
          type: flowType,
          business_id: flowType === "claim" ? businessId : null,
          business_name: flowType === "list" ? businessName : null,
          street: flowType === "list" ? street : null,
          city: flowType === "list" ? city : null,
          state: flowType === "list" ? stateValue : null,
          metro_id: flowType === "list" ? metroId : null,
          postal_code: flowType === "list" ? postalCode : null,
          email,
          full_name: fullName || null,
          phone: phone || null,
          role_title: roleTitle || null,
          notes: notes || null,
        })
        .select("id")
        .single();

      if (error || !request) {
        setStatus(getFriendlyStatus(error?.message));
        setIsSubmitting(false);
        return;
      }

      if (files && files.length > 0) {
        for (const file of Array.from(files)) {
          const path = `${user.id}/${request.id}/${file.name}`;
          const upload = await supabase.storage.from("onboarding-docs").upload(path, file);
          if (upload.error) {
            setStatus(upload.error.message);
            setIsSubmitting(false);
            return;
          }
          await supabase.schema("public").from("onboarding_documents").insert({
            onboarding_request_id: request.id,
            storage_path: path,
            file_name: file.name,
            mime_type: file.type,
          });
        }
      }

      setSubmitted(true);
      setStatus("We got your info — we’ll review it shortly.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Request submitted</CardTitle>
          <CardDescription>We’re reviewing your documents now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          <Button asChild>
            <Link href="/onboarding/status">View request status</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          {flowType ? <Badge variant="outline">{flowType === "claim" ? "Claim" : "List"}</Badge> : null}
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-2 rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Claim your business</CardTitle>
                <CardDescription>Already listed? Claim it to manage your leads.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" onClick={() => handleChooseFlow("claim")}>
                  Claim a listing
                </Button>
              </CardContent>
            </Card>
            <Card className="border border-border">
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
        ) : null}

        {step === 1 && flowType === "claim" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="business">
              Select your business
            </label>
            <select
              id="business"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={businessId}
              onChange={(event) => setBusinessId(event.target.value)}
              required
            >
              <option value="">Choose a listing</option>
              {claimableProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.business_name} — {provider.city}, {provider.state}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {step === 1 && flowType === "list" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="businessName">
                Business name
              </label>
              <Input
                id="businessName"
                required
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="street">
                Street address
              </label>
              <Input
                id="street"
                required
                value={street}
                onChange={(event) => setStreet(event.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="city">
                  City
                </label>
                <Input
                  id="city"
                  required
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="state">
                  State
                </label>
                <Input
                  id="state"
                  required
                  value={stateValue}
                  onChange={(event) => setStateValue(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="postalCode">
                  Postal code
                </label>
                <Input
                  id="postalCode"
                  required
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="metro">
                  Metro
                </label>
                <select
                  id="metro"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={metroId}
                  onChange={(event) => setMetroId(event.target.value)}
                  required
                >
                  <option value="">Choose a metro</option>
                  {metros.map((metro) => (
                    <option key={metro.id} value={metro.id}>
                      {metro.name}, {metro.state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="fullName">
                  Full name
                </label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="phone">
                  Phone
                </label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="roleTitle">
                  Role / title
                </label>
                <Input
                  id="roleTitle"
                  value={roleTitle}
                  onChange={(event) => setRoleTitle(event.target.value)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="notes">
                Notes
              </label>
              <Input
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="docs">
                Upload documentation
              </label>
              <Input
                id="docs"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.heic"
                onChange={(event) => setFiles(event.target.files)}
              />
              <p className="text-xs text-muted-foreground">
                Upload business license, insurance, or ownership proof. Accepted files: PDF, JPG,
                PNG, HEIC.
              </p>
            </div>
          </div>
        ) : null}

        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : null}
          {step > 0 && step < TOTAL_STEPS - 1 ? (
            <Button type="button" onClick={handleNext} disabled={!flowType && step === 0}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit request"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
