"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import {
  moveLeadStageAction,
  reassignLeadAction,
  returnLeadToPoolAction,
} from "../../app/admin/leads/actions";
import {
  declineLeadProviderAction,
  moveLeadStageProviderAction,
} from "../../app/dashboard/leads/actions";

type LeadRowUI = {
  id: string;
  created_at: string;
  provider_id?: string | null;
  metro_id?: string | null;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  resolution_status: string | null;
  escalated_at: string | null;
  escalation_reason?: string | null;
  delivery_status: string;
  delivery_error?: string | null;
  name: string;
  email?: string | null;
  phone: string | null;
  provider?: { business_name: string; slug?: string } | null;
  metro?: { name: string; slug?: string; state: string } | null;
};

type LeadState = "NEW" | "VIEWED" | "CONTACTED" | "ESCALATED" | "RESOLVED";
type LeadsBoardMode = "admin" | "provider";

type LeadsBoardProps = {
  leads: LeadRowUI[];
  mode: LeadsBoardMode;
  providerOptionsByMetro?: Record<string, { id: string; business_name: string | null }[]>;
};

const columns: Array<{ key: LeadState; label: string }> = [
  { key: "NEW", label: "New" },
  { key: "VIEWED", label: "Viewed" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "ESCALATED", label: "Escalated" },
  { key: "RESOLVED", label: "Resolved" },
];

const columnStyles: Record<LeadState, string> = {
  NEW: "bg-amber-50/70",
  VIEWED: "bg-sky-50/70",
  CONTACTED: "bg-emerald-50/70",
  ESCALATED: "bg-rose-50/70",
  RESOLVED: "bg-slate-50/70",
};

const stateBadgeStyles: Record<LeadState, string> = {
  NEW: "border-amber-200/70 bg-amber-100/60 text-amber-900",
  VIEWED: "border-sky-200/70 bg-sky-100/70 text-sky-900",
  CONTACTED: "border-emerald-200/70 bg-emerald-100/70 text-emerald-900",
  ESCALATED: "border-rose-200/70 bg-rose-100/70 text-rose-900",
  RESOLVED: "border-slate-200/70 bg-slate-100/70 text-slate-900",
};

const deliveryVariants: Record<string, "secondary" | "destructive" | "outline"> = {
  delivered: "secondary",
  failed: "destructive",
  pending: "outline",
  skipped: "outline",
};

const deliveryLabels: Record<string, string> = {
  pending: "Pending",
  delivered: "Delivered",
  failed: "Failed",
  skipped: "Skipped",
};

const leadStateOrder: LeadState[] = ["NEW", "VIEWED", "CONTACTED", "ESCALATED", "RESOLVED"];

const providerTransitions: Record<LeadState, LeadState[]> = {
  NEW: ["VIEWED"],
  VIEWED: ["CONTACTED"],
  CONTACTED: ["RESOLVED"],
  ESCALATED: [],
  RESOLVED: [],
};

const DECLINE_REASONS = [
  { value: "too_far", label: "Too far away" },
  { value: "no_capacity", label: "No capacity" },
  { value: "not_a_fit", label: "Not a fit" },
  { value: "pricing", label: "Pricing mismatch" },
  { value: "other", label: "Other" },
];

function getLeadState(lead: LeadRowUI): LeadState {
  if (lead.resolved_at) return "RESOLVED";
  if (lead.escalated_at) return "ESCALATED";
  if (lead.last_contacted_at) return "CONTACTED";
  if (lead.viewed_at) return "VIEWED";
  return "NEW";
}

function canDropLead(mode: LeadsBoardMode, lead: LeadRowUI, target: LeadState): {
  allowed: boolean;
  reason?: string;
} {
  const currentState = getLeadState(lead);
  if (currentState === target) {
    return { allowed: false, reason: "Already in this column." };
  }

  const currentIndex = leadStateOrder.indexOf(currentState);
  const targetIndex = leadStateOrder.indexOf(target);
  if (targetIndex < currentIndex) {
    return { allowed: false, reason: "Cannot move a lead backward." };
  }

  if (mode === "provider") {
    if (target === "ESCALATED") {
      return { allowed: false, reason: "Escalation is admin-only." };
    }
    const allowedTargets = providerTransitions[currentState] ?? [];
    if (!allowedTargets.includes(target)) {
      return { allowed: false, reason: "Move leads forward one step at a time." };
    }
  }

  return { allowed: true };
}

function applyLeadStageUpdate(
  lead: LeadRowUI,
  target: LeadState,
  timestamp: string
): LeadRowUI {
  switch (target) {
    case "VIEWED":
      return {
        ...lead,
        viewed_at: lead.viewed_at ?? timestamp,
      };
    case "CONTACTED":
      return {
        ...lead,
        last_contacted_at: timestamp,
      };
    case "ESCALATED":
      return {
        ...lead,
        escalated_at: timestamp,
        escalation_reason: "manual_board",
      };
    case "RESOLVED":
      return {
        ...lead,
        resolved_at: timestamp,
        resolution_status: lead.resolution_status ?? "closed",
      };
    default:
      return lead;
  }
}

export default function LeadsBoard({ leads, mode, providerOptionsByMetro }: LeadsBoardProps) {
  const [localLeads, setLocalLeads] = useState(leads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<LeadState | null>(null);
  const [declineSelections, setDeclineSelections] = useState<Record<string, string>>({});
  const [declineNotes, setDeclineNotes] = useState<Record<string, string>>({});
  const [reassignSelections, setReassignSelections] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

  const draggedLead = draggedLeadId
    ? localLeads.find((lead) => lead.id === draggedLeadId) ?? null
    : null;

  const handleDrop = (target: LeadState) => {
    if (!draggedLead) return;
    const { allowed } = canDropLead(mode, draggedLead, target);
    if (!allowed) return;

    startTransition(async () => {
      const result =
        mode === "admin"
          ? await moveLeadStageAction(draggedLead.id, target)
          : await moveLeadStageProviderAction(draggedLead.id, target);

      if (result.ok) {
        const now = new Date().toISOString();
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === draggedLead.id ? applyLeadStageUpdate(lead, target, now) : lead
          )
        );
      }
    });
  };

  const handleReturnToPool = (leadId: string) => {
    startTransition(async () => {
      const result = await returnLeadToPoolAction(leadId);
      if (result.ok) {
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  provider_id: null,
                  provider: null,
                  delivery_status: "pending",
                }
              : lead
          )
        );
      }
    });
  };

  const handleReassign = (leadId: string, providerId: string, metroId?: string | null) => {
    if (!providerId) return;
    startTransition(async () => {
      const result = await reassignLeadAction(leadId, providerId);
      if (result.ok) {
        const providerList = metroId ? providerOptionsByMetro?.[metroId] ?? [] : [];
        const providerName =
          providerList.find((provider) => provider.id === providerId)?.business_name ??
          "Assigned provider";
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  provider_id: providerId,
                  provider: { business_name: providerName, slug: lead.provider?.slug ?? "" },
                  delivery_status: "pending",
                }
              : lead
          )
        );
      }
    });
  };

  const handleDecline = (leadId: string) => {
    const reason = declineSelections[leadId] ?? "";
    const note = declineNotes[leadId] ?? "";
    if (!reason) return;
    startTransition(async () => {
      const result = await declineLeadProviderAction(leadId, reason, note);
      if (result.ok) {
        setLocalLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      }
    });
  };

  const renderCard = (lead: LeadRowUI) => {
    const metroLabel = lead.metro ? `${lead.metro.name}, ${lead.metro.state}` : "Unknown metro";
    const providerLabel =
      mode === "admin"
        ? lead.provider?.business_name ?? "Metro Pool"
        : "Assigned to your team";
    const emailLabel = lead.email ?? "No email";
    const providerList =
      lead.metro_id && providerOptionsByMetro?.[lead.metro_id]
        ? providerOptionsByMetro[lead.metro_id]
        : [];

    return (
      <Card
        key={lead.id}
        className={cn(
          "cursor-pointer border-border/70 bg-background p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md",
          draggedLeadId === lead.id ? "opacity-70" : ""
        )}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", lead.id);
          event.dataTransfer.effectAllowed = "move";
          setDraggedLeadId(lead.id);
        }}
        onDragEnd={() => {
          setDraggedLeadId(null);
          setActiveColumn(null);
        }}
        onClick={() => {
          if (draggedLeadId) return;
          const basePath = mode === "admin" ? "/admin/leads" : "/dashboard/leads";
          router.push(`${basePath}/${lead.id}`);
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="text-sm font-semibold text-foreground">{lead.name}</div>
          <div className="text-xs text-muted-foreground">
            {lead.phone ?? "No phone"} · {emailLabel}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border", stateBadgeStyles[getLeadState(lead)])}>
              {getLeadState(lead)}
            </Badge>
            <Badge
              variant={deliveryVariants[lead.delivery_status] ?? "outline"}
              title={lead.delivery_error ?? undefined}
            >
              {deliveryLabels[lead.delivery_status] ?? lead.delivery_status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>{metroLabel}</span>
            <span>•</span>
            <span>{providerLabel}</span>
            <span>•</span>
            <span>{new Date(lead.created_at).toLocaleString()}</span>
          </div>
          {mode === "admin" ? (
            <div
              className="mt-2 flex flex-wrap items-center gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={reassignSelections[lead.id] ?? ""}
                onChange={(event) =>
                  setReassignSelections((prev) => ({ ...prev, [lead.id]: event.target.value }))
                }
              >
                <option value="">Reassign...</option>
                {providerList.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.business_name ?? "Unnamed provider"}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() =>
                  handleReassign(lead.id, reassignSelections[lead.id] ?? "", lead.metro_id)
                }
                disabled={isPending || !reassignSelections[lead.id]}
              >
                Assign
              </Button>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => handleReturnToPool(lead.id)}
                disabled={isPending}
              >
                Return to pool
              </Button>
            </div>
          ) : null}
          {mode === "provider" ? (
            <div
              className="mt-2 space-y-2"
              onClick={(event) => event.stopPropagation()}
            >
              <select
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                value={declineSelections[lead.id] ?? ""}
                onChange={(event) =>
                  setDeclineSelections((prev) => ({ ...prev, [lead.id]: event.target.value }))
                }
              >
                <option value="">Decline reason...</option>
                {DECLINE_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
              <Input
                className="h-8 text-xs"
                placeholder="Optional note"
                value={declineNotes[lead.id] ?? ""}
                onChange={(event) =>
                  setDeclineNotes((prev) => ({ ...prev, [lead.id]: event.target.value }))
                }
              />
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => handleDecline(lead.id)}
                disabled={isPending || !declineSelections[lead.id]}
              >
                Decline lead
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {columns.map((column) => {
        const dropState = draggedLead ? canDropLead(mode, draggedLead, column.key) : null;
        const dropHint = dropState?.allowed
          ? "Drop to move lead."
          : dropState?.reason ?? undefined;

        return (
          <div
            key={column.key}
            className={cn(
              "rounded-xl border border-border/60 p-3",
              columnStyles[column.key],
              activeColumn === column.key ? "ring-2 ring-primary/40" : ""
            )}
            title={draggedLead ? dropHint : undefined}
            onDragOver={(event) => {
              if (!draggedLead) return;
              if (canDropLead(mode, draggedLead, column.key).allowed) {
                event.preventDefault();
                setActiveColumn(column.key);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(column.key);
              setActiveColumn(null);
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {column.label}
              </h2>
              <Badge variant="outline">{grouped[column.key].length}</Badge>
            </div>
            <div className="mt-3 space-y-3">
              {grouped[column.key].map(renderCard)}
              {!grouped[column.key].length ? (
                <div className="rounded-md border border-dashed border-border/70 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  {isPending ? "Updating..." : "No leads yet."}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
