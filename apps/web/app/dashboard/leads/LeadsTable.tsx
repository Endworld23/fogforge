"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  markLeadContactedProviderAction,
  markLeadViewedProviderAction,
  setLeadFollowUpProviderAction,
  setLeadResolvedProviderAction,
} from "./actions";

type LeadRowUI = {
  id: string;
  created_at: string;
  status: string;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  escalated_at: string | null;
  resolution_status: string | null;
  delivery_status: string;
  delivered_at: string | null;
  delivery_error: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source_url: string | null;
  follow_up_at: string | null;
  next_action: string | null;
};

type LeadsTableProps = {
  leads: LeadRowUI[];
};

const deliveryLabels: Record<string, string> = {
  pending: "Pending",
  delivered: "Delivered",
  failed: "Failed",
  skipped: "Skipped",
};

export default function LeadsTable({ leads }: LeadsTableProps) {
  const [localLeads, setLocalLeads] = useState(leads);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [followUpDrafts, setFollowUpDrafts] = useState<Record<string, string>>({});
  const [nextActionDrafts, setNextActionDrafts] = useState<Record<string, string>>({});
  const [resolveSelections, setResolveSelections] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const getStateBadge = (lead: LeadRowUI) => {
    if (lead.resolved_at) {
      return { label: "Resolved", variant: "secondary" as const };
    }
    if (lead.escalated_at) {
      return { label: "Escalated", variant: "destructive" as const };
    }
    if (lead.last_contacted_at) {
      return { label: "Contacted", variant: "outline" as const };
    }
    if (lead.viewed_at) {
      return { label: "Viewed", variant: "outline" as const };
    }
    return { label: "New", variant: "default" as const };
  };

  const handleViewLead = (leadId: string) => {
    if (viewedIds.has(leadId)) {
      return;
    }
    setViewedIds((prev) => new Set(prev).add(leadId));
    startTransition(async () => {
      await markLeadViewedProviderAction(leadId);
      setLocalLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId
            ? { ...lead, viewed_at: lead.viewed_at ?? new Date().toISOString() }
            : lead
        )
      );
    });
  };

  const handleMarkContacted = (leadId: string) => {
    startTransition(async () => {
      const result = await markLeadContactedProviderAction(leadId);
      if (result.ok) {
        const now = new Date().toISOString();
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, last_contacted_at: now } : lead
          )
        );
      }
    });
  };

  const handleResolve = (leadId: string, resolutionStatus: string) => {
    if (!resolutionStatus) {
      return;
    }
    startTransition(async () => {
      const result = await setLeadResolvedProviderAction(
        leadId,
        resolutionStatus as "won" | "lost" | "closed" | "spam"
      );
      if (result.ok) {
        const now = new Date().toISOString();
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? { ...lead, resolved_at: now, resolution_status: resolutionStatus }
              : lead
          )
        );
      }
    });
  };

  const handleSaveFollowUp = (leadId: string) => {
    const followUpAt = followUpDrafts[leadId] ?? "";
    const nextAction = nextActionDrafts[leadId] ?? "";
    startTransition(async () => {
      const result = await setLeadFollowUpProviderAction(leadId, followUpAt || null, nextAction || null);
      if (result.ok) {
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  follow_up_at: followUpAt ? new Date(followUpAt).toISOString() : null,
                  next_action: nextAction.trim() || null,
                }
              : lead
          )
        );
      }
    });
  };

  const toLocalInputValue = (value: string | null) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const pad = (unit: number) => unit.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Delivery</TableHead>
          <TableHead></TableHead>
          <TableHead>Lifecycle</TableHead>
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {localLeads.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center text-sm text-muted-foreground">
              No leads yet.
            </TableCell>
          </TableRow>
        ) : (
          localLeads.map((lead) => {
            const stateBadge = getStateBadge(lead);
            const followUpValue =
              followUpDrafts[lead.id] ?? toLocalInputValue(lead.follow_up_at);
            const nextActionValue = nextActionDrafts[lead.id] ?? (lead.next_action ?? "");
            return (
              <TableRow key={lead.id}>
                <TableCell>{new Date(lead.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={lead.status === "new" ? "default" : "outline"}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={stateBadge.variant}>{stateBadge.label}</Badge>
                </TableCell>
                <TableCell>
                  <Link
                    className="text-primary underline-offset-4 hover:underline"
                    href={`/dashboard/leads/${lead.id}`}
                  >
                    {lead.name}
                  </Link>
                </TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={lead.delivery_status === "delivered" ? "secondary" : "outline"}>
                    {deliveryLabels[lead.delivery_status] ?? lead.delivery_status}
                  </Badge>
                  {lead.delivery_error ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {lead.delivery_error}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => handleViewLead(lead.id)}
                    disabled={isPending || Boolean(lead.viewed_at)}
                  >
                    {lead.viewed_at ? "Viewed" : "View"}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="mt-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => handleMarkContacted(lead.id)}
                        disabled={isPending}
                      >
                        Mark contacted
                      </Button>
                      <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={resolveSelections[lead.id] ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setResolveSelections((prev) => ({
                            ...prev,
                            [lead.id]: value,
                          }));
                          handleResolve(lead.id, value);
                        }}
                      >
                        <option value="">Resolve...</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                        <option value="closed">Closed</option>
                        <option value="spam">Spam</option>
                      </select>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[220px_1fr_auto]">
                      <Input
                        type="datetime-local"
                        value={followUpValue}
                        onChange={(event) =>
                          setFollowUpDrafts((prev) => ({
                            ...prev,
                            [lead.id]: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Next action"
                        value={nextActionValue}
                        onChange={(event) =>
                          setNextActionDrafts((prev) => ({
                            ...prev,
                            [lead.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => handleSaveFollowUp(lead.id)}
                        disabled={isPending}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs text-sm text-muted-foreground">
                  {lead.message ?? "—"}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
