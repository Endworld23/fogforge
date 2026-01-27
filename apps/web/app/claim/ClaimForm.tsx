"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { submitProviderClaimAction } from "./actions";

type ClaimFormProps = {
  providerId: string;
  providerName: string;
};

const initialState = {
  ok: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit claim request"}
    </Button>
  );
}

export default function ClaimForm({ providerId, providerName }: ClaimFormProps) {
  const [state, formAction] = useFormState(submitProviderClaimAction, initialState);

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <form className="space-y-4" action={formAction}>
          <input type="hidden" name="providerId" value={providerId} />
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="provider">
              Business
            </label>
            <Input id="provider" value={providerName} readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="message">
              Message (optional)
            </label>
            <Input
              id="message"
              name="message"
              placeholder="Share ownership context or notes for the team."
            />
          </div>
          {state.message ? (
            <Alert className={state.ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}>
              <AlertDescription className={state.ok ? "text-emerald-900" : "text-amber-900"}>
                {state.message}
              </AlertDescription>
            </Alert>
          ) : null}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
