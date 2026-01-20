"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import AdminEmptyState from "../../../components/admin/AdminEmptyState";
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
  escalateLeadAction,
  markLeadContactedAction,
  markLeadSentAction,
  markLeadViewedAction,
  resendLeadAction,
  setLeadFollowUpAction,
  setLeadResolvedAction,
} from "./actions";

type LeadRowUI = {
  id: string;
  created_at: string;
  status: string;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  resolution_status: string | null;
  escalated_at: string | null;
  escalation_reason: string | null;
  follow_up_at: string | null;
  next_action: string | null;
  delivery_status: string;
  delivered_at: string | null;
  delivery_error: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source_url: string | null;
  provider: { business_name: string; slug: string } | null;
  metro: { name: string; slug: string; state: string } | null;
  category: { slug: string; name: string | null } | null;
};

const statusLabels: Record<string, string> = {
  new: "New",
  sent: "Sent",
  failed: "Failed",
  spam: "Spam",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  sent: "secondary",
  failed: "destructive",
  spam: "outline",
};

const deliveryLabels: Record<string, string> = {
  pending: "Pending",
  delivered: "Delivered",
  failed: "Failed",
};

const deliveryVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  delivered: "secondary",
  failed: "destructive",
};

type LeadsTableProps = {
  leads: LeadRowUI[];
};

export default function LeadsTable({ leads }: LeadsTableProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [deliveryNotice, setDeliveryNotice] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [followUpDrafts, setFollowUpDrafts] = useState<Record<string, string>>({});
  const [nextActionDrafts, setNextActionDrafts] = useState<Record<string, string>>({});
  const [resolveSelections, setResolveSelections] = useState<Record<string, string>>({});
  const [escalationSelections, setEscalationSelections] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [localLeads, setLocalLeads] = useState(leads);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return localLeads.filter((lead) => {
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const providerName = lead.provider?.business_name?.toLowerCase() ?? "";
      const email = lead.email?.toLowerCase() ?? "";
      return providerName.includes(normalizedQuery) || email.includes(normalizedQuery);
    });
  }, [localLeads, query, statusFilter]);

  const handleResetFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  const toggleExpanded = (leadId: string) => {
    const willExpand = !expanded.includes(leadId);
    setExpanded((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
    const lead = localLeads.find((item) => item.id === leadId);
    if (willExpand && !viewedIds.has(leadId) && !lead?.viewed_at) {
      setViewedIds((prev) => new Set(prev).add(leadId));
      startTransition(async () => {
        await markLeadViewedAction(leadId);
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? { ...lead, viewed_at: lead.viewed_at ?? new Date().toISOString() }
              : lead
          )
        );
      });
    }
  };

  const handleMarkSent = (leadId: string) => {
    setNotice(null);
    startTransition(async () => {
      const result = await markLeadSentAction(leadId);
      setNotice(result);
      if (result.ok) {
        setLocalLeads((prev) =>
          prev.map((lead) => (lead.id === leadId ? { ...lead, status: "sent" } : lead))
        );
      }
    });
  };

  const handleResend = (leadId: string) => {
    setDeliveryNotice(null);
    setResendingId(leadId);
    startTransition(async () => {
      const result = await resendLeadAction(leadId);
      if (!result.ok) {
        setDeliveryNotice(result.message);
      }
      if (result.ok) {
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  delivery_status: "delivered",
                  delivered_at: new Date().toISOString(),
                  delivery_error: null,
                }
              : lead
          )
        );
      }
      setResendingId(null);
    });
  };

  const handleMarkContacted = (leadId: string) => {
    startTransition(async () => {
      const result = await markLeadContactedAction(leadId);
      setNotice(result);
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
      const result = await setLeadResolvedAction(
        leadId,
        resolutionStatus as "won" | "lost" | "closed" | "spam"
      );
      setNotice(result);
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
      const result = await setLeadFollowUpAction(leadId, followUpAt || null, nextAction || null);
      setNotice(result);
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

  const handleEscalate = (leadId: string) => {
    const reason = escalationSelections[leadId] ?? "";
    if (!reason) {
      return;
    }
    startTransition(async () => {
      const result = await escalateLeadAction(leadId, reason);
      setNotice(result);
      if (result.ok) {
        const now = new Date().toISOString();
        setLocalLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? { ...lead, escalated_at: now, escalation_reason: reason }
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

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "new", label: "New" },
    { value: "sent", label: "Sent" },
    { value: "failed", label: "Failed" },
    { value: "spam", label: "Spam" },
  ];

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={statusFilter === option.value ? "default" : "outline"}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search provider or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Badge variant="outline">
            {filteredLeads.length} lead{filteredLeads.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      {notice ? (
        <Alert className={notice.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}>
          <AlertDescription className={notice.ok ? "text-emerald-900" : "text-rose-900"}>
            {notice.ok ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {notice.message}
              </span>
            ) : (
              notice.message
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      {deliveryNotice ? (
        <Alert className="border-rose-200 bg-rose-50">
          <AlertDescription className="text-rose-900">{deliveryNotice}</AlertDescription>
        </Alert>
      ) : null}

      {filteredLeads.length === 0 ? (
        <AdminEmptyState
          title="No leads found"
          description="Try adjusting your filters or search query."
          action={
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Reset filters
            </Button>
          }
        />
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Metro</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeads.map((lead) => {
            const isExpanded = expanded.includes(lead.id);
            const canResend = lead.delivery_status !== "delivered";
            const isTestLead = lead.source_url === "admin://test-lead";
            const stateBadge = getStateBadge(lead);
            const followUpValue =
              followUpDrafts[lead.id] ?? toLocalInputValue(lead.follow_up_at);
            const nextActionValue = nextActionDrafts[lead.id] ?? (lead.next_action ?? "");
            return (
              <Fragment key={lead.id}>
                <TableRow key={lead.id}>
                    <TableCell>
                      {new Date(lead.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[lead.status] ?? "outline"}>
                        {statusLabels[lead.status] ?? lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stateBadge.variant}>{stateBadge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {lead.provider?.slug && lead.metro?.slug && lead.metro?.state ? (
                        <Link
                          className="text-primary underline-offset-4 hover:underline"
                          href={`/grease-trap-cleaning/${lead.metro.state.toLowerCase()}/${
                            lead.metro.slug
                          }/${lead.provider.slug}`}
                        >
                          {lead.provider.business_name}
                        </Link>
                      ) : (
                        lead.provider?.business_name ?? "Unknown"
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.metro ? (
                        <span>
                          {lead.metro.name}, {lead.metro.state}
                        </span>
                      ) : (
                        "Unknown"
                      )}
                    </TableCell>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone ?? "—"}</TableCell>
                    <TableCell>
                      {lead.source_url ? (
                        <a
                          className="text-primary underline-offset-4 hover:underline"
                          href={lead.source_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={deliveryVariants[lead.delivery_status] ?? "outline"}>
                        {deliveryLabels[lead.delivery_status] ?? lead.delivery_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => toggleExpanded(lead.id)}
                        >
                          {isExpanded ? (
                            <>
                              Hide
                              <ChevronUp className="ml-1 h-4 w-4" />
                            </>
                          ) : (
                            <>
                              View
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>
                        {canResend ? (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => handleResend(lead.id)}
                            disabled={isPending || resendingId === lead.id}
                          >
                            {resendingId === lead.id
                              ? "Resending..."
                              : isTestLead
                                ? "Send now"
                                : "Resend"}
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => handleMarkSent(lead.id)}
                          disabled={lead.status !== "new" || isPending}
                        >
                          Mark as Sent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow key={`${lead.id}-message`}>
                      <TableCell colSpan={11} className="bg-muted/30 text-sm text-foreground">
                        <div className="space-y-4">
                          <div className="whitespace-pre-wrap">
                            {lead.message ? lead.message : "No message provided."}
                          </div>
                          {lead.delivery_error ? (
                            <div className="text-xs text-muted-foreground">
                              Delivery error: {lead.delivery_error}
                            </div>
                          ) : null}
                          <div className="rounded-md border border-border bg-background p-3">
                            <div className="text-xs font-semibold uppercase text-muted-foreground">
                              Lifecycle
                            </div>
                            <div className="mt-3 space-y-3">
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
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                  value={escalationSelections[lead.id] ?? ""}
                                  onChange={(event) =>
                                    setEscalationSelections((prev) => ({
                                      ...prev,
                                      [lead.id]: event.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Escalate reason...</option>
                                  <option value="no_view">No view</option>
                                  <option value="no_response">No response</option>
                                  <option value="billing">Billing</option>
                                  <option value="quality">Quality</option>
                                  <option value="other">Other</option>
                                </select>
                                <Button
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleEscalate(lead.id)}
                                  disabled={isPending || !escalationSelections[lead.id]}
                                >
                                  Escalate
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      )}
    </div>
  );
}
