"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "../../../../../../components/ui/alert";
import { Button } from "../../../../../../components/ui/button";
import { Input } from "../../../../../../components/ui/input";
import { Separator } from "../../../../../../components/ui/separator";
import { submitLeadAction } from "./actions";
import { createBrowserClient } from "../../../../../../lib/supabase/browser";

type LeadFormProps = {
  providerId: string;
  categoryId: string;
  metroId: string;
};

const initialState = {
  ok: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Submitting..." : "Request a Quote"}
    </Button>
  );
}

export default function LeadForm({ providerId, categoryId, metroId }: LeadFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [state, formAction] = useFormState(submitLeadAction, initialState);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setSourceUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

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

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="metroId" value={metroId} />
      <input type="hidden" name="sourceUrl" value={sourceUrl} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            Name
          </label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="phone">
          Phone (optional)
        </label>
        <Input id="phone" name="phone" />
        <p className="text-xs text-muted-foreground">
          Optional, but helpful if you prefer a callback.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="message">
          Message (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <p className="text-xs text-muted-foreground">
          Include timing, location, and any special requirements.
        </p>
      </div>

      {state.message ? (
        <Alert
          className={
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }
        >
          <AlertDescription className={state.ok ? "text-emerald-900" : "text-rose-900"}>
            <div className="space-y-2">
              <div>{state.message}</div>
              {state.ok && isAdmin ? (
                <a
                  className="inline-flex items-center gap-1 text-sm text-emerald-900 underline underline-offset-4"
                  href="/admin/leads"
                >
                  View in Admin
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton />
      <Separator />
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        By submitting, you agree to share your contact details with this provider.
      </p>
    </form>
  );
}
