"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  escalateLeadAction,
  markLeadContactedAction,
  markLeadSentAction,
  resendLeadAction,
  returnLeadToPoolAction,
  reassignLeadAction,
  setLeadFollowUpAction,
  setLeadResolvedAction,
} from "../actions";

type ProviderOption = {
  id: string;
  business_name: string | null;
};

type LeadDetailActionsProps = {
  leadId: string;
  providerOptions: ProviderOption[];
  status: string;
};

export default function LeadDetailActions({ leadId, providerOptions, status }: LeadDetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [resolveSelection, setResolveSelection] = useState("");
  const [escalationSelection, setEscalationSelection] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [reassignSelection, setReassignSelection] = useState("");
  const router = useRouter();

  const handleResend = () => {
    startTransition(async () => {
      await resendLeadAction(leadId);
      router.refresh();
    });
  };

  const handleMarkSent = () => {
    startTransition(async () => {
      await markLeadSentAction(leadId);
      router.refresh();
    });
  };

  const handleContacted = () => {
    startTransition(async () => {
      await markLeadContactedAction(leadId);
      router.refresh();
    });
  };

  const handleResolve = () => {
    if (!resolveSelection) return;
    startTransition(async () => {
      await setLeadResolvedAction(
        leadId,
        resolveSelection as "won" | "lost" | "closed" | "spam"
      );
      setResolveSelection("");
      router.refresh();
    });
  };

  const handleEscalate = () => {
    if (!escalationSelection) return;
    startTransition(async () => {
      await escalateLeadAction(leadId, escalationSelection);
      setEscalationSelection("");
      router.refresh();
    });
  };

  const handleSaveFollowUp = () => {
    startTransition(async () => {
      await setLeadFollowUpAction(leadId, followUpAt || null, nextAction || null);
      router.refresh();
    });
  };

  const handleReturnToPool = () => {
    startTransition(async () => {
      await returnLeadToPoolAction(leadId);
      router.refresh();
    });
  };

  const handleReassign = () => {
    if (!reassignSelection) return;
    startTransition(async () => {
      await reassignLeadAction(leadId, reassignSelection);
      setReassignSelection("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" type="button" onClick={handleResend} disabled={isPending}>
          Resend delivery
        </Button>
        <Button
          size="sm"
          type="button"
          onClick={handleMarkSent}
          disabled={isPending || status !== "new"}
        >
          Mark as sent
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={handleContacted} disabled={isPending}>
          Mark contacted
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={resolveSelection}
          onChange={(event) => setResolveSelection(event.target.value)}
        >
          <option value="">Resolve...</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="closed">Closed</option>
          <option value="spam">Spam</option>
        </select>
        <Button size="sm" variant="outline" type="button" onClick={handleResolve} disabled={isPending}>
          Resolve
        </Button>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={escalationSelection}
          onChange={(event) => setEscalationSelection(event.target.value)}
        >
          <option value="">Escalate reason...</option>
          <option value="no_view">No view</option>
          <option value="no_response">No response</option>
          <option value="billing">Billing</option>
          <option value="quality">Quality</option>
          <option value="other">Other</option>
        </select>
        <Button size="sm" variant="outline" type="button" onClick={handleEscalate} disabled={isPending}>
          Escalate
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-[220px_1fr_auto]">
        <Input
          type="datetime-local"
          value={followUpAt}
          onChange={(event) => setFollowUpAt(event.target.value)}
        />
        <Input
          placeholder="Next action"
          value={nextAction}
          onChange={(event) => setNextAction(event.target.value)}
        />
        <Button size="sm" variant="outline" type="button" onClick={handleSaveFollowUp} disabled={isPending}>
          Save follow-up
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 min-w-[220px] rounded-md border border-input bg-background px-3 text-sm"
          value={reassignSelection}
          onChange={(event) => setReassignSelection(event.target.value)}
        >
          <option value="">Reassign...</option>
          {providerOptions.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.business_name ?? "Unnamed provider"}
            </option>
          ))}
        </select>
        <Button size="sm" variant="outline" type="button" onClick={handleReassign} disabled={isPending}>
          Assign
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={handleReturnToPool} disabled={isPending}>
          Return to pool
        </Button>
      </div>
    </div>
  );
}
