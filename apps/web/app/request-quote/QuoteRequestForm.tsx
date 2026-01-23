"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { submitQuoteRequestAction } from "./actions";

type MetroRow = {
  id: string;
  name: string;
  slug: string;
  state: string;
};

type ProviderSummary = {
  id: string;
  business_name: string;
};

type QuoteRequestFormProps = {
  metros: MetroRow[];
  categoryId: string;
  initialMetroId?: string | null;
  initialState?: string | null;
  provider?: ProviderSummary | null;
};

type QuoteRequestResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  formError?: string;
};

export default function QuoteRequestForm({
  metros,
  categoryId,
  initialMetroId = null,
  initialState: initialStateValue = null,
  provider = null,
}: QuoteRequestFormProps) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [result, setResult] = useState<QuoteRequestResult>({
    ok: false,
    message: "",
    fieldErrors: {},
    formError: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedState, setSelectedState] = useState(initialStateValue ?? "");
  const [selectedMetroId, setSelectedMetroId] = useState(initialMetroId ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [message, setMessage] = useState("");
  const fieldErrors = result.fieldErrors ?? {};

  useEffect(() => {
    setSourceUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (result.ok) {
      setShowSuccess(true);
    }
  }, [result.ok]);

  const states = useMemo(() => {
    const unique = new Set(metros.map((metro) => metro.state));
    return Array.from(unique).sort();
  }, [metros]);

  const filteredMetros = useMemo(() => {
    if (!selectedState) return metros;
    return metros.filter((metro) => metro.state === selectedState);
  }, [metros, selectedState]);

  const metroLabel = useMemo(() => {
    const match = metros.find((metro) => metro.id === selectedMetroId);
    return match ? `${match.name}, ${match.state}` : "";
  }, [metros, selectedMetroId]);

  const isMetroLocked = Boolean(initialMetroId);
  const isStateLocked = Boolean(initialStateValue);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setBusinessName("");
    setEmail("");
    setPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setZip("");
    setMessage("");
    if (!isStateLocked) {
      setSelectedState("");
    }
    if (!isMetroLocked) {
      setSelectedMetroId("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setResult((prev) => ({ ...prev, formError: "", fieldErrors: {} }));

    const formData = new FormData();
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("business_name", businessName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("address_line1", addressLine1);
    formData.append("address_line2", addressLine2);
    formData.append("city", city);
    formData.append("state", selectedState);
    formData.append("zip", zip);
    formData.append("message", message);
    formData.append("metroId", selectedMetroId);
    formData.append("providerId", provider?.id ?? "");
    formData.append("categoryId", categoryId);
    formData.append("sourceUrl", sourceUrl);
    formData.append("company", "");

    const nextResult = await submitQuoteRequestAction(result, formData);
    setResult(nextResult);
    setIsSubmitting(false);

    if (nextResult.ok) {
      resetForm();
    }
  };

  if (showSuccess) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="h-5 w-5" />
            Request received
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-emerald-900">
          <p>{result.message || "Thanks for your request. We’ll be in touch soon."}</p>
          <Link
            className="inline-flex items-center gap-1 text-sm text-emerald-900 underline underline-offset-4"
            href="/grease-trap-cleaning"
          >
            Browse providers
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Button type="button" variant="outline" onClick={() => setShowSuccess(false)}>
            Send another request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input
        type="text"
        name="company"
        autoComplete="off"
        tabIndex={-1}
        className="hidden"
        aria-hidden="true"
      />

      {provider ? (
        <Card className="border-border/70 bg-muted/40">
          <CardHeader>
            <CardTitle className="text-base">Requesting a quote from</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {provider.business_name}
            {metroLabel ? ` · ${metroLabel}` : ""}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="first_name">
            First name
          </label>
          <Input
            id="first_name"
            name="first_name"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
          {fieldErrors.first_name ? (
            <p className="text-xs text-rose-500">{fieldErrors.first_name}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="last_name">
            Last name
          </label>
          <Input
            id="last_name"
            name="last_name"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
          {fieldErrors.last_name ? (
            <p className="text-xs text-rose-500">{fieldErrors.last_name}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="business_name">
            Business name
          </label>
          <Input
            id="business_name"
            name="business_name"
            autoComplete="organization"
            required
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
          />
          {fieldErrors.business_name ? (
            <p className="text-xs text-rose-500">{fieldErrors.business_name}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="address_line1">
            Address line 1
          </label>
          <Input
            id="address_line1"
            name="address_line1"
            autoComplete="address-line1"
            required
            value={addressLine1}
            onChange={(event) => setAddressLine1(event.target.value)}
          />
          {fieldErrors.address_line1 ? (
            <p className="text-xs text-rose-500">{fieldErrors.address_line1}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="address_line2">
            Address line 2 (optional)
          </label>
          <Input
            id="address_line2"
            name="address_line2"
            autoComplete="address-line2"
            value={addressLine2}
            onChange={(event) => setAddressLine2(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="city">
            City
          </label>
          <Input
            id="city"
            name="city"
            autoComplete="address-level2"
            required
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          {fieldErrors.city ? <p className="text-xs text-rose-500">{fieldErrors.city}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="state">
            State
          </label>
          {isStateLocked ? (
            <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm">
              {selectedState}
            </div>
          ) : (
            <select
              id="state"
              name="state"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedState}
              onChange={(event) => {
                setSelectedState(event.target.value);
                setSelectedMetroId("");
              }}
              required
            >
              <option value="">Choose a state</option>
              {states.map((stateOption) => (
                <option key={stateOption} value={stateOption}>
                  {stateOption}
                </option>
              ))}
            </select>
          )}
          {fieldErrors.state ? <p className="text-xs text-rose-500">{fieldErrors.state}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="zip">
            ZIP
          </label>
          <Input
            id="zip"
            name="zip"
            autoComplete="postal-code"
            required
            value={zip}
            onChange={(event) => setZip(event.target.value)}
          />
          {fieldErrors.zip ? <p className="text-xs text-rose-500">{fieldErrors.zip}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
          {fieldErrors.email ? <p className="text-xs text-rose-500">{fieldErrors.email}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="phone">
            Phone
          </label>
          <Input
            id="phone"
            name="phone"
            autoComplete="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Phone helps us connect you with the fastest available provider. We won’t spam you.
          </p>
          {fieldErrors.phone ? <p className="text-xs text-rose-500">{fieldErrors.phone}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="metroId">
            Metro
          </label>
          {isMetroLocked ? (
            <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm">
              {metroLabel || "Selected metro"}
            </div>
          ) : (
            <select
              id="metroId"
              name="metroId"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedMetroId}
              onChange={(event) => setSelectedMetroId(event.target.value)}
              required
            >
              <option value="">Choose a metro</option>
              {filteredMetros.map((metro) => (
                <option key={metro.id} value={metro.id}>
                  {metro.name}, {metro.state}
                </option>
              ))}
            </select>
          )}
          {fieldErrors.metroId ? <p className="text-xs text-rose-500">{fieldErrors.metroId}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="message">
          Message (optional, recommended)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Describe your cleaning schedule, timeline, and any special needs."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>

      {result.formError ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertDescription className="text-amber-900">{result.formError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Request a Quote"}
      </Button>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        We only share your request with providers that can help.
      </p>
    </form>
  );
}
