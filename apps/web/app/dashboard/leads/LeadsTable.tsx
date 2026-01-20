"use client";

import { useState, useTransition } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { markLeadViewedProviderAction } from "./actions";

type LeadRowUI = {
  id: string;
  created_at: string;
  status: string;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  escalated_at: string | null;
  delivery_status: string;
  delivered_at: string | null;
  delivery_error: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source_url: string | null;
};

type LeadsTableProps = {
  leads: LeadRowUI[];
};

export default function LeadsTable({ leads }: LeadsTableProps) {
  const [localLeads, setLocalLeads] = useState(leads);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
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
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {localLeads.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
              No leads yet.
            </TableCell>
          </TableRow>
        ) : (
          localLeads.map((lead) => {
            const stateBadge = getStateBadge(lead);
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
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={lead.delivery_status === "delivered" ? "secondary" : "outline"}>
                    {lead.delivery_status}
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
