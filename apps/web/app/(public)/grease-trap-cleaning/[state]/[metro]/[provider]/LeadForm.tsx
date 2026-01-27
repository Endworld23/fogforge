"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "../../../../../../components/ui/alert";
import { Button } from "../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card";
import { Input } from "../../../../../../components/ui/input";
import { submitLeadAction } from "./actions";
import { createBrowserClient } from "../../../../../../lib/supabase/browser";
import { cn } from "../../../../../../lib/utils";

type LeadFormProps = {
  providerId: string;
  categoryId: string;
  metroId: string;
};

type LeadFormResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  formError?: string;
};

export default function LeadForm({ providerId, categoryId, metroId }: LeadFormProps) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [formStartedAt, setFormStartedAt] = useState(0);
  const [result, setResult] = useState<LeadFormResult>({
    ok: false,
    message: "",
    fieldErrors: {},
    formError: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const fieldErrors = result.fieldErrors ?? {};
  const errorInputClass = "border-rose-500 ring-1 ring-rose-500 focus-visible:ring-rose-500";

  useEffect(() => {
    setSourceUrl(window.location.href);
    setFormStartedAt(Date.now());
  }, []);

  useEffect(() => {
    if (result.ok) {
      setShowSuccess(true);
    }
  }, [result.ok]);

  useEffect(() => {
    const fetchAdmin = async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .schema("public")
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsAdmin(Boolean(data));
    };

    fetchAdmin();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setResult((prev) => ({ ...prev, formError: "", fieldErrors: {} }));

    const formData = new FormData();
    formData.append("providerId", providerId);
    formData.append("categoryId", categoryId);
    formData.append("metroId", metroId);
    formData.append("sourceUrl", sourceUrl);
    formData.append("formStartedAt", formStartedAt.toString());
    formData.append("company", "");
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("message", message);

    const nextResult = await submitLeadAction(result, formData);
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
            Request sent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-emerald-900">
          <p>{result.message || "Your request is on the way to this provider."}</p>
          {isAdmin ? (
            <Link
              className="inline-flex items-center gap-1 text-sm text-emerald-900 underline underline-offset-4"
              href="/admin/leads"
            >
              View in Admin
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            Name
          </label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={Boolean(fieldErrors.name)}
            className={cn(fieldErrors.name ? errorInputClass : null)}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">We use this to personalize your request.</p>
          {fieldErrors.name ? <p className="text-xs text-rose-500">{fieldErrors.name}</p> : null}
        </div>
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
            aria-invalid={Boolean(fieldErrors.email)}
            className={cn(fieldErrors.email ? errorInputClass : null)}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Required so the provider can reply.</p>
          {fieldErrors.email ? <p className="text-xs text-rose-500">{fieldErrors.email}</p> : null}
        </div>
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
          aria-invalid={Boolean(fieldErrors.phone)}
          className={cn(fieldErrors.phone ? errorInputClass : null)}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Phone helps us connect you with the fastest available provider. We won’t spam you.
        </p>
        {fieldErrors.phone ? <p className="text-xs text-rose-500">{fieldErrors.phone}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="message">
          Message (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            fieldErrors.message ? errorInputClass : null
          )}
          aria-invalid={Boolean(fieldErrors.message)}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Include timing, location, and any special requirements.
        </p>
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
        We’ll only share your info with this provider.
      </p>
    </form>
  );
}
