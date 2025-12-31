"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="spam">Spam</option>
          </select>
          <Input
            className="w-full md:w-64"
            placeholder="Search provider or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredLeads.length} lead{filteredLeads.length === 1 ? "" : "s"}
        </p>
      </div>

      {notice ? (
        <div
          className={
            notice.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              : "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          }
        >
          {notice.message}
        </div>
      ) : null}

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
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                No leads match this filter.
              </TableCell>
            </TableRow>
          ) : (
            filteredLeads.map((lead) => {
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => toggleExpanded(lead.id)}
                        >
                          {isExpanded ? "Hide" : "View"}
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
                      <TableCell colSpan={9} className="bg-muted/30 text-sm text-foreground">
                        {lead.message ? lead.message : "No message provided."}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
