"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import {
  escalateLeadAction,
  markLeadContactedAction,
  markLeadViewedAction,
  setLeadResolvedAction,
} from "../actions";

type LeadRowUI = {
  id: string;
  created_at: string;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  resolution_status: string | null;
  escalated_at: string | null;
  escalation_reason: string | null;
  delivery_status: string;
  name: string;
  phone: string | null;
  provider: { business_name: string; slug: string } | null;
  metro: { name: string; slug: string; state: string } | null;
};

type LeadsBoardProps = {
  leads: LeadRowUI[];
};

type LeadState = "NEW" | "VIEWED" | "CONTACTED" | "ESCALATED" | "RESOLVED";

const RESOLUTION_OPTIONS = [
  { value: "", label: "Resolve..." },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
];

const ESCALATION_OPTIONS = [
  { value: "", label: "Escalate..." },
  { value: "no_view", label: "No view" },
  { value: "no_response", label: "No response" },
  { value: "billing", label: "Billing" },
  { value: "quality", label: "Quality" },
  { value: "other", label: "Other" },
];

const deliveryVariants: Record<string, "secondary" | "destructive" | "outline"> = {
  delivered: "secondary",
  failed: "destructive",
  pending: "outline",
};

function getLeadState(lead: LeadRowUI): LeadState {
  if (lead.resolved_at) return "RESOLVED";
  if (lead.escalated_at) return "ESCALATED";
  if (lead.last_contacted_at) return "CONTACTED";
  if (lead.viewed_at) return "VIEWED";
  return "NEW";
}

export default function LeadsBoard({ leads }: LeadsBoardProps) {
  const [localLeads, setLocalLeads] = useState(leads);
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const buckets: Record<LeadState, LeadRowUI[]> = {
      NEW: [],
      VIEWED: [],
      CONTACTED: [],
      ESCALATED: [],
      RESOLVED: [],
    };
    localLeads.forEach((lead) => {
      buckets[getLeadState(lead)].push(lead);
    });
    return buckets;
  }, [localLeads]);

  const handleMarkViewed = (leadId: string) => {
    startTransition(async () => {
      const result = await markLeadViewedAction(leadId);
      if (result.ok) {
        const now = new Date().toISOString();
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, viewed_at: lead.viewed_at ?? now } : lead
          )
        );
      }
    });
  };

  const handleMarkContacted = (leadId: string) => {
    startTransition(async () => {
      const result = await markLeadContactedAction(leadId);
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
    if (!resolutionStatus) return;
    startTransition(async () => {
      const result = await setLeadResolvedAction(
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

  const handleEscalate = (leadId: string, reason: string) => {
    if (!reason) return;
    startTransition(async () => {
      const result = await escalateLeadAction(leadId, reason);
      if (result.ok) {
        const now = new Date().toISOString();
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, escalated_at: now, escalation_reason: reason } : lead
          )
        );
      }
    });
  };

  const renderCard = (lead: LeadRowUI) => {
    const metroLabel = lead.metro ? `${lead.metro.name}, ${lead.metro.state}` : "Unknown metro";
    const providerLabel = lead.provider?.business_name
      ? lead.provider.business_name
      : `Metro Pool — ${metroLabel}`;

    return (
      <Card key={lead.id} className="border-border">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">{lead.name}</CardTitle>
          <div className="text-xs text-muted-foreground">{providerLabel}</div>
          <div className="text-xs text-muted-foreground">{metroLabel}</div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>{lead.phone ?? "No phone"}</span>
            <Badge variant={deliveryVariants[lead.delivery_status] ?? "outline"}>
              {lead.delivery_status}
            </Badge>
          </div>
          <div className="text-xs">
            {new Date(lead.created_at).toLocaleString()}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => handleMarkViewed(lead.id)}
              disabled={isPending || Boolean(lead.viewed_at)}
            >
              {lead.viewed_at ? "Viewed" : "Mark viewed"}
            </Button>
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
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              defaultValue=""
              onChange={(event) => {
                handleResolve(lead.id, event.target.value);
                event.currentTarget.value = "";
              }}
            >
              {RESOLUTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              defaultValue=""
              onChange={(event) => {
                handleEscalate(lead.id, event.target.value);
                event.currentTarget.value = "";
              }}
            >
              {ESCALATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>
    );
  };

  const columns: Array<{ key: LeadState; label: string }> = [
    { key: "NEW", label: "New" },
    { key: "VIEWED", label: "Viewed" },
    { key: "CONTACTED", label: "Contacted" },
    { key: "ESCALATED", label: "Escalated" },
    { key: "RESOLVED", label: "Resolved" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {columns.map((column) => (
        <div key={column.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{column.label}</h2>
            <Badge variant="outline">{grouped[column.key].length}</Badge>
          </div>
          <div className="space-y-3">
            {grouped[column.key].map(renderCard)}
          </div>
        </div>
      ))}
    </div>
  );
}
