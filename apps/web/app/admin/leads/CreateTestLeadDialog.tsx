"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { createTestLeadAction } from "./actions";

type ProviderOption = {
  id: string;
  business_name: string | null;
};

type CreateTestLeadDialogProps = {
  providers: ProviderOption[];
};

export default function CreateTestLeadDialog({ providers }: CreateTestLeadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasProviders = providers.length > 0;
  const selectedProviderId = providerId || "—";

  const handleCopyProviderId = async () => {
    if (!providerId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(providerId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setNotice({ ok: false, message: "Unable to copy provider id." });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setNotice(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!providerId || !name.trim() || !email.trim()) {
      setNotice({ ok: false, message: "Provider, name, and email are required." });
      return;
    }

    startTransition(async () => {
      const result = await createTestLeadAction({
        providerId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        message: message.trim() || null,
      });

      setNotice({ ok: result.ok, message: result.message });

      if (result.ok) {
        setProviderId("");
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Create test lead
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Create test lead</h2>
                <p className="text-sm text-muted-foreground">
                  Creates a lead without delivering it so you can test Resend.
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={handleClose}>
                Close
              </Button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="test-provider">
                  Provider
                </label>
                <select
                  id="test-provider"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={providerId}
                  onChange={(event) => setProviderId(event.target.value)}
                  required
                >
                  <option value="">Select a provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.business_name ?? "Unnamed provider"}
                    </option>
                  ))}
                </select>
                {hasProviders ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Provider id: {selectedProviderId}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyProviderId}
                      disabled={!providerId}
                    >
                      {copied ? "Copied" : "Copy provider id"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-rose-500">No providers available to create a test lead.</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="test-name">
                    Name
                  </label>
                  <Input
                    id="test-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="test-email">
                    Email
                  </label>
                  <Input
                    id="test-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="jane@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="test-phone">
                    Phone
                  </label>
                  <Input
                    id="test-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="test-message">
                  Message
                </label>
                <textarea
                  id="test-message"
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Optional message"
                />
              </div>

              {notice ? (
                <Alert className={notice.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}>
                  <AlertDescription className={notice.ok ? "text-emerald-900" : "text-rose-900"}>
                    {notice.message}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !hasProviders}>
                  {isPending ? "Creating..." : "Create lead"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
