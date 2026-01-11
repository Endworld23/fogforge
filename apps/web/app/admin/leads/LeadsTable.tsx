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
import { markLeadSentAction } from "./actions";

type LeadRow = {
  id: string;
  created_at: string;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source_url: string | null;
  provider: { business_name: string; slug: string } | null;
  metro: { name: string; slug: string; state: string } | null;
  category: { slug: string; name: string | null } | null;
  delivery: { status: string; error: string | null; created_at: string } | null;
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

const deliveryVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "secondary",
  failed: "destructive",
};

type LeadsTableProps = {
  leads: LeadRow[];
};

export default function LeadsTable({ leads }: LeadsTableProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
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
    setExpanded((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
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

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "new", label: "New" },
    { value: "sent", label: "Sent" },
    { value: "failed", label: "Failed" },
    { value: "spam", label: "Spam" },
  ];

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
                      {lead.delivery ? (
                        <Badge variant={deliveryVariants[lead.delivery.status] ?? "outline"}>
                          {lead.delivery.status}
                        </Badge>
                      ) : (
                        <Badge variant="outline">pending</Badge>
                      )}
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
                      <TableCell colSpan={10} className="bg-muted/30 text-sm text-foreground">
                        <div className="space-y-2">
                          <div className="whitespace-pre-wrap">
                            {lead.message ? lead.message : "No message provided."}
                          </div>
                          {lead.delivery?.error ? (
                            <div className="text-xs text-muted-foreground">
                              Delivery error: {lead.delivery.error}
                            </div>
                          ) : null}
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
