"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { createBrowserClient } from "../../lib/supabase/browser";

type ProviderOption = {
  id: string;
  business_name: string;
  city: string;
  state: string;
};

type ClaimOnboardingFormProps = {
  providers: ProviderOption[];
  userEmail: string;
};

export default function ClaimOnboardingForm({ providers, userEmail }: ClaimOnboardingFormProps) {
  const [businessId, setBusinessId] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      if (!businessId) {
        setStatus("Select a business to claim.");
        setIsSubmitting(false);
        return;
      }

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
          type: "claim",
          business_id: businessId,
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

      setStatus("Request submitted. We’ll review your documents shortly.");
      setBusinessId("");
      setFullName("");
      setPhone("");
      setRoleTitle("");
      setNotes("");
      setFiles(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
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
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.business_name} — {provider.city}, {provider.state}
                </option>
              ))}
            </select>
          </div>

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
              onChange={(event) => setFiles(event.target.files)}
            />
            <p className="text-xs text-muted-foreground">
              Upload business license, insurance, or ownership proof.
            </p>
          </div>

          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit claim request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
