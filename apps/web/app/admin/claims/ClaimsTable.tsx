"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { approveClaimRequestAction, rejectClaimRequestAction, verifyProviderFromClaimAction } from "./actions";

type ClaimRow = {
  id: string;
  provider_id: string;
  requester_user_id: string;
  requester_email: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string | null;
  created_at: string;
  reviewed_at: string | null;
  claimant_first_name: string | null;
  claimant_last_name: string | null;
  claimant_phone: string | null;
  claimant_role: string | null;
  claimant_role_other: string | null;
  claimant_address_line1: string | null;
  claimant_address_line2: string | null;
  claimant_city: string | null;
  claimant_state: string | null;
  claimant_zip: string | null;
  provider: {
    business_name: string;
    city: string | null;
    state: string | null;
    verified_at: string | null;
    metros: { name: string; state: string }[] | null;
  } | null;
  documents: { id: string; doc_type: string; file_url: string }[];
};

type ClaimsTableProps = {
  claims: ClaimRow[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatAddress(claim: ClaimRow) {
  const parts = [
    claim.claimant_address_line1,
    claim.claimant_address_line2,
    [claim.claimant_city, claim.claimant_state].filter(Boolean).join(", "),
    claim.claimant_zip,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

export default function ClaimsTable({ claims }: ClaimsTableProps) {
  const [rows, setRows] = useState(claims);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateRow = (id: string, updates: Partial<ClaimRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      setNotice(null);
      const result = await approveClaimRequestAction(id);
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      updateRow(id, { status: "APPROVED", reviewed_at: new Date().toISOString() });
      setNotice(result.message);
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      setNotice(null);
      const result = await rejectClaimRequestAction(id);
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      updateRow(id, { status: "REJECTED", reviewed_at: new Date().toISOString() });
      setNotice(result.message);
    });
  };

  const handleVerify = (id: string, providerId: string) => {
    startTransition(async () => {
      setNotice(null);
      const result = await verifyProviderFromClaimAction(providerId);
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                provider: row.provider
                  ? { ...row.provider, verified_at: new Date().toISOString() }
                  : row.provider,
              }
            : row
        )
      );
      setNotice(result.message);
    });
  };

  return (
    <div className="space-y-4">
      {notice ? <div className="text-sm text-muted-foreground">{notice}</div> : null}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No claim requests yet.
          </CardContent>
        </Card>
      ) : (
        rows.map((claim) => {
          const providerName = claim.provider?.business_name ?? "Provider missing";
          const metro = claim.provider?.metros?.[0]
            ? `${claim.provider.metros[0].name}, ${claim.provider.metros[0].state}`
            : null;
          const location =
            metro ??
            (claim.provider?.city && claim.provider?.state
              ? `${claim.provider.city}, ${claim.provider.state}`
              : null);
          const requesterLabel = claim.requester_email ?? claim.requester_user_id;
          const isVerified = Boolean(claim.provider?.verified_at);
          const claimantName = [claim.claimant_first_name, claim.claimant_last_name]
            .filter(Boolean)
            .join(" ");
          const roleLabel = claim.claimant_role
            ? `${claim.claimant_role}${
                claim.claimant_role === "Other" && claim.claimant_role_other
                  ? ` (${claim.claimant_role_other})`
                  : ""
              }`
            : "—";
          return (
            <Card key={claim.id}>
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>
                    <Link className="underline-offset-4 hover:underline" href={`/admin/claims/${claim.id}`}>
                      {providerName}
                    </Link>
                  </CardTitle>
                  <Badge
                    variant={
                      claim.status === "PENDING"
                        ? "secondary"
                        : claim.status === "APPROVED"
                          ? "outline"
                          : "destructive"
                    }
                  >
                    {claim.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {location ?? `Provider ID: ${claim.provider_id}`}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Claimant</p>
                    <div>{claimantName || "—"}</div>
                    <div>Email: {requesterLabel}</div>
                    <div>Phone: {claim.claimant_phone ?? "—"}</div>
                    <div>Role: {roleLabel}</div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Address</p>
                    <div>{formatAddress(claim)}</div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Request details</p>
                  <div>Submitted: {formatDate(claim.created_at)}</div>
                  <div>Reviewed: {formatDate(claim.reviewed_at)}</div>
                  {claim.message ? <div>Message: {claim.message}</div> : null}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Documents</p>
                  {claim.documents.length ? (
                    <ul className="space-y-1">
                      {claim.documents.map((doc) => (
                        <li key={doc.id}>
                          <a
                            className="text-primary underline-offset-4 hover:underline"
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {doc.doc_type}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>No documents uploaded.</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/claims/${claim.id}`}>Review</Link>
                  </Button>
                  {claim.status === "PENDING" ? (
                    <>
                      <Button size="sm" onClick={() => handleApprove(claim.id)} disabled={isPending}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(claim.id)}
                        disabled={isPending}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {claim.status === "APPROVED" && !isVerified ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerify(claim.id, claim.provider_id)}
                      disabled={isPending}
                    >
                      Verify provider
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
