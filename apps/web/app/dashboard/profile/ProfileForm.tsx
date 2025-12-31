"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Separator } from "../../../components/ui/separator";
import { updateProviderProfileAction } from "./actions";

type ProviderProfile = {
  id: string;
  business_name: string;
  phone: string | null;
  website_url: string | null;
  email_public: string | null;
  description: string | null;
  street: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  is_published: boolean;
};

const initialState = {
  ok: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

export default function ProfileForm({ provider }: { provider: ProviderProfile }) {
  const [state, formAction] = useFormState(updateProviderProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="providerId" value={provider.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="business_name">
            Business name
          </label>
          <Input id="business_name" name="business_name" defaultValue={provider.business_name} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email_public">
            Public email
          </label>
          <Input id="email_public" name="email_public" type="email" defaultValue={provider.email_public ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="phone">
            Phone
          </label>
          <Input id="phone" name="phone" defaultValue={provider.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="website_url">
            Website
          </label>
          <Input id="website_url" name="website_url" defaultValue={provider.website_url ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={provider.description ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="street">
            Street
          </label>
          <Input id="street" name="street" defaultValue={provider.street ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="postal_code">
            Postal code
          </label>
          <Input id="postal_code" name="postal_code" defaultValue={provider.postal_code ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="city">
            City
          </label>
          <Input id="city" name="city" defaultValue={provider.city} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="state">
            State
          </label>
          <Input id="state" name="state" defaultValue={provider.state} required />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_published"
          name="is_published"
          type="checkbox"
          defaultChecked={provider.is_published}
          className="h-4 w-4 rounded border-border"
        />
        <label htmlFor="is_published" className="text-sm text-muted-foreground">
          Publish listing
        </label>
      </div>

      {state.message ? (
        <Alert className={state.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}>
          <AlertDescription className={state.ok ? "text-emerald-900" : "text-rose-900"}>
            {state.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton />
    </form>
  );
}
