"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { createBrowserClient } from "../../lib/supabase/browser";

type MetroOption = {
  id: string;
  name: string;
  state: string;
};

type ListOnboardingFormProps = {
  metros: MetroOption[];
  userEmail: string;
};

export default function ListOnboardingForm({ metros, userEmail }: ListOnboardingFormProps) {
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [metroId, setMetroId] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
          type: "list",
          business_name: businessName,
          city,
          state,
          metro_id: metroId || null,
          email,
          full_name: fullName || null,
          phone: phone || null,
          role_title: roleTitle || null,
          notes: notes || null,
        })
        .select("id")
        .single();

      if (error || !request) {
        setStatus(error?.message ?? "Unable to submit request.");
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
      setBusinessName("");
      setCity("");
      setState("");
      setMetroId("");
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
                value={state}
                onChange={(event) => setState(event.target.value)}
              />
            </div>
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
            {isSubmitting ? "Submitting..." : "Submit listing request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
