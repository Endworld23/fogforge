"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  declineLeadProviderAction,
  markLeadContactedProviderAction,
  markLeadViewedProviderAction,
  setLeadFollowUpProviderAction,
  setLeadResolvedProviderAction,
} from "../actions";

type LeadDetailActionsProps = {
  leadId: string;
};

const DECLINE_REASONS = [
  { value: "too_far", label: "Too far away" },
  { value: "no_capacity", label: "No capacity" },
  { value: "not_a_fit", label: "Not a fit" },
  { value: "pricing", label: "Pricing mismatch" },
  { value: "other", label: "Other" },
];

export default function LeadDetailActions({ leadId }: LeadDetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [resolveSelection, setResolveSelection] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [declineNote, setDeclineNote] = useState("");
  const router = useRouter();

  const handleViewed = () => {
    startTransition(async () => {
      await markLeadViewedProviderAction(leadId);
      router.refresh();
    });
  };

  const handleContacted = () => {
    startTransition(async () => {
      await markLeadContactedProviderAction(leadId);
      router.refresh();
    });
  };

  const handleResolve = () => {
    if (!resolveSelection) return;
    startTransition(async () => {
      await setLeadResolvedProviderAction(
        leadId,
        resolveSelection as "won" | "lost" | "closed" | "spam"
      );
      setResolveSelection("");
      router.refresh();
    });
  };

  const handleSaveFollowUp = () => {
    startTransition(async () => {
      await setLeadFollowUpProviderAction(leadId, followUpAt || null, nextAction || null);
      router.refresh();
    });
  };

  const handleDecline = () => {
    if (!declineReason) return;
    startTransition(async () => {
      await declineLeadProviderAction(leadId, declineReason, declineNote);
      router.push("/dashboard/leads");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" type="button" onClick={handleViewed} disabled={isPending}>
          Mark viewed
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

      <div className="space-y-2">
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={declineReason}
          onChange={(event) => setDeclineReason(event.target.value)}
        >
          <option value="">Decline reason...</option>
          {DECLINE_REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
        <Input
          placeholder="Optional note"
          value={declineNote}
          onChange={(event) => setDeclineNote(event.target.value)}
        />
        <Button size="sm" variant="outline" type="button" onClick={handleDecline} disabled={isPending}>
          Decline lead
        </Button>
      </div>
    </div>
  );
}
