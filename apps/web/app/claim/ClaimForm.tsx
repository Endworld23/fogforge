"use client";

import { useMemo, useState, useTransition } from "react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { createBrowserClient } from "../../lib/supabase/browser";
import { cn } from "../../lib/utils";
import { submitProviderClaimAction } from "./actions";

type ClaimFormProps = {
  providerId: string;
  providerName: string;
};

type DocItem = {
  id: string;
  docType: string;
  file: File | null;
};

const DOC_TYPES = [
  "Government ID",
  "Business license / registration",
  "Proof of address (utility bill)",
  "Insurance certificate",
  "EIN letter / tax document",
  "Authorization letter (if not owner)",
];

const ROLE_OPTIONS = ["Owner", "Manager", "Employee", "Agent", "Other"];
const ZIP_REGEX = /^\d{5}(?:-\d{4})?$/;

const errorInputClass = "border-rose-500 focus-visible:ring-rose-500";

export default function ClaimForm({ providerId, providerName }: ClaimFormProps) {
  const [claimRequestId] = useState(() => crypto.randomUUID());
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [roleOther, setRoleOther] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zip, setZip] = useState("");
  const [message, setMessage] = useState("");
  const [docs, setDocs] = useState<DocItem[]>([
    { id: crypto.randomUUID(), docType: "", file: null },
    { id: crypto.randomUUID(), docType: "", file: null },
  ]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const updateDoc = (id: string, updates: Partial<DocItem>) => {
    setDocs((prev) => prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc)));
  };

  const addDocRow = () => {
    setDocs((prev) => [...prev, { id: crypto.randomUUID(), docType: "", file: null }]);
  };

  const removeDocRow = (id: string) => {
    setDocs((prev) => prev.filter((doc) => doc.id !== id));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!firstName.trim()) nextErrors.claimant_first_name = "First name is required.";
    if (!lastName.trim()) nextErrors.claimant_last_name = "Last name is required.";
    if (!phone.trim()) nextErrors.claimant_phone = "Phone is required.";
    if (phone && normalizedPhone.length < 10) {
      nextErrors.claimant_phone = "Please enter a valid 10-digit phone number.";
    }
    if (!role) nextErrors.claimant_role = "Role is required.";
    if (role === "Other" && !roleOther.trim()) {
      nextErrors.claimant_role_other = "Please specify your role.";
    }
    if (!address1.trim()) nextErrors.claimant_address_line1 = "Address line 1 is required.";
    if (!city.trim()) nextErrors.claimant_city = "City is required.";
    if (!stateValue.trim()) nextErrors.claimant_state = "State is required.";
    if (!zip.trim()) nextErrors.claimant_zip = "ZIP is required.";
    if (zip && !ZIP_REGEX.test(zip)) {
      nextErrors.claimant_zip = "Please enter a valid ZIP code.";
    }

    const validDocs = docs.filter((doc) => doc.docType && doc.file);
    if (validDocs.length < 2) {
      nextErrors.documents = "Please upload at least two documents.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    startTransition(async () => {
      const supabase = createBrowserClient();
      const preparedDocs = docs.filter((doc) => doc.docType && doc.file);
      const uploadedDocs: { docType: string; filePath: string; fileUrl: string }[] = [];

      for (const doc of preparedDocs) {
        if (!doc.file) continue;
        const filePath = `${claimRequestId}/${crypto.randomUUID()}-${doc.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("claim-documents")
          .upload(filePath, doc.file);
        if (uploadError) {
          setFormError(uploadError.message);
          return;
        }
        const { data: signed } = await supabase.storage
          .from("claim-documents")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);
        if (!signed?.signedUrl) {
          setFormError("Unable to generate a document link. Please retry.");
          return;
        }
        uploadedDocs.push({
          docType: doc.docType,
          filePath,
          fileUrl: signed.signedUrl,
        });
      }

      if (uploadedDocs.length < 2) {
        setFormError("Please upload at least two documents.");
        return;
      }

      const formData = new FormData();
      formData.set("providerId", providerId);
      formData.set("claimRequestId", claimRequestId);
      formData.set("claimant_first_name", firstName);
      formData.set("claimant_last_name", lastName);
      formData.set("claimant_phone", phone);
      formData.set("claimant_role", role);
      formData.set("claimant_role_other", roleOther);
      formData.set("claimant_address_line1", address1);
      formData.set("claimant_address_line2", address2);
      formData.set("claimant_city", city);
      formData.set("claimant_state", stateValue);
      formData.set("claimant_zip", zip);
      formData.set("message", message);
      formData.set("documents", JSON.stringify(uploadedDocs));

      const result = await submitProviderClaimAction({ ok: false, message: "" }, formData);
      if (!result.ok) {
        setFormError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      setSuccessMessage(result.message || "Claim request submitted.");
    });
  };

  if (successMessage) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <h2 className="text-lg font-semibold text-foreground">Claim request submitted</h2>
          <p className="text-sm text-muted-foreground">{successMessage}</p>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Next steps</p>
            <ul className="mt-2 space-y-1">
              <li>• Our team reviews your documents.</li>
              <li>• We will email you with an approval or rejection.</li>
              <li>• Approved claims can access the provider dashboard.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="provider">
              Business
            </label>
            <Input id="provider" value={providerName} readOnly />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="claimant_first_name">
                First name
              </label>
              <Input
                id="claimant_first_name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={cn(fieldErrors.claimant_first_name && errorInputClass)}
                aria-invalid={Boolean(fieldErrors.claimant_first_name)}
              />
              {fieldErrors.claimant_first_name ? (
                <p className="text-xs text-rose-600">{fieldErrors.claimant_first_name}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="claimant_last_name">
                Last name
              </label>
              <Input
                id="claimant_last_name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={cn(fieldErrors.claimant_last_name && errorInputClass)}
                aria-invalid={Boolean(fieldErrors.claimant_last_name)}
              />
              {fieldErrors.claimant_last_name ? (
                <p className="text-xs text-rose-600">{fieldErrors.claimant_last_name}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="claimant_phone">
                Phone
              </label>
              <Input
                id="claimant_phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={cn(fieldErrors.claimant_phone && errorInputClass)}
                aria-invalid={Boolean(fieldErrors.claimant_phone)}
              />
              {fieldErrors.claimant_phone ? (
                <p className="text-xs text-rose-600">{fieldErrors.claimant_phone}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="claimant_role">
                Role
              </label>
              <select
                id="claimant_role"
                className={cn(
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
                  fieldErrors.claimant_role && errorInputClass
                )}
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="">Select role</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {fieldErrors.claimant_role ? (
                <p className="text-xs text-rose-600">{fieldErrors.claimant_role}</p>
              ) : null}
            </div>
          </div>

          {role === "Other" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="claimant_role_other">
                Role details
              </label>
              <Input
                id="claimant_role_other"
                value={roleOther}
                onChange={(event) => setRoleOther(event.target.value)}
                className={cn(fieldErrors.claimant_role_other && errorInputClass)}
                aria-invalid={Boolean(fieldErrors.claimant_role_other)}
              />
              {fieldErrors.claimant_role_other ? (
                <p className="text-xs text-rose-600">{fieldErrors.claimant_role_other}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="claimant_address_line1">
              Address line 1
            </label>
            <Input
              id="claimant_address_line1"
              value={address1}
              onChange={(event) => setAddress1(event.target.value)}
              className={cn(fieldErrors.claimant_address_line1 && errorInputClass)}
              aria-invalid={Boolean(fieldErrors.claimant_address_line1)}
            />
            {fieldErrors.claimant_address_line1 ? (
              <p className="text-xs text-rose-600">{fieldErrors.claimant_address_line1}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="claimant_address_line2">
              Address line 2 (optional)
            </label>
            <Input
              id="claimant_address_line2"
              value={address2}
              onChange={(event) => setAddress2(event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium text-foreground" htmlFor="claimant_city">
                City
              </label>
              <Input
                id="claimant_city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className={cn(fieldErrors.claimant_city && errorInputClass)}
                aria-invalid={Boolean(fieldErrors.claimant_city)}
              />
              {fieldErrors.claimant_city ? (
                <p className="text-xs text-rose-600">{fieldErrors.claimant_city}</p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium text-foreground" htmlFor="claimant_state">
                State
              </label>
              <Input
                id="claimant_state"
                value={stateValue}
                onChange={(event) => setStateValue(event.target.value)}
                className={cn(fieldErrors.claimant_state && errorInputClass)}
                aria-invalid={Boolean(fieldErrors.claimant_state)}
              />
              {fieldErrors.claimant_state ? (
                <p className="text-xs text-rose-600">{fieldErrors.claimant_state}</p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium text-foreground" htmlFor="claimant_zip">
                ZIP
              </label>
              <Input
                id="claimant_zip"
                value={zip}
                onChange={(event) => setZip(event.target.value)}
                className={cn(fieldErrors.claimant_zip && errorInputClass)}
                aria-invalid={Boolean(fieldErrors.claimant_zip)}
              />
              {fieldErrors.claimant_zip ? (
                <p className="text-xs text-rose-600">{fieldErrors.claimant_zip}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="message">
              Message (optional)
            </label>
            <Input
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Share ownership context or notes for the team."
            />
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Verification documents</p>
              <p className="text-xs text-muted-foreground">
                We require at least two documents to verify ownership and protect businesses from fraud.
                Accepted documents include:
              </p>
              <ul className="text-xs text-muted-foreground">
                {DOC_TYPES.map((doc) => (
                  <li key={doc}>• {doc}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              {docs.map((doc, index) => (
                <div key={doc.id} className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
                  <select
                    className={cn(
                      "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
                      fieldErrors.documents && !doc.docType && errorInputClass
                    )}
                    value={doc.docType}
                    onChange={(event) => updateDoc(doc.id, { docType: event.target.value })}
                  >
                    <option value="">Document type</option>
                    {DOC_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="file"
                    onChange={(event) => updateDoc(doc.id, { file: event.target.files?.[0] ?? null })}
                    className={cn(fieldErrors.documents && !doc.file && errorInputClass)}
                  />
                  <div className="flex items-center">
                    {docs.length > 2 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeDocRow(doc.id)}
                      >
                        Remove
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addDocRow}>
              Add another document
            </Button>
            {fieldErrors.documents ? (
              <p className="text-xs text-rose-600">{fieldErrors.documents}</p>
            ) : null}
          </div>

          {formError ? (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-900">{formError}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Submitting..." : "Submit claim request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
