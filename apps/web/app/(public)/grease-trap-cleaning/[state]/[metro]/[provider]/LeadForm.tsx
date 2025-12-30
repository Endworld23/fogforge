"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Button } from "../../../../../../components/ui/button";
import { Input } from "../../../../../../components/ui/input";
import { submitLeadAction } from "./actions";

type LeadFormProps = {
  providerId: string;
  categoryId: string;
  metroId: string;
};

const initialState = {
  ok: false,
  message: "",
};

export default function LeadForm({ providerId, categoryId, metroId }: LeadFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [state, formAction] = useFormState(submitLeadAction, initialState);

  useEffect(() => {
    setSourceUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

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
      </div>

      {state.message ? (
        <div
          className={
            state.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              : "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          }
        >
          {state.message}
        </div>
      ) : null}

      <Button type="submit">Request a Quote</Button>
    </form>
  );
}
