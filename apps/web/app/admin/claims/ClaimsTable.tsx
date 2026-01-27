"use client";

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
  provider: {
    business_name: string;
    city: string | null;
    state: string | null;
    verified_at: string | null;
  } | null;
};

type ClaimsTableProps = {
  claims: ClaimRow[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
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
          const providerName = claim.provider?.business_name ?? "Unknown provider";
          const location = claim.provider?.city && claim.provider?.state
            ? `${claim.provider.city}, ${claim.provider.state}`
            : null;
          const requesterLabel = claim.requester_email ?? claim.requester_user_id;
          const isVerified = Boolean(claim.provider?.verified_at);
          return (
            <Card key={claim.id}>
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{providerName}</CardTitle>
                  <Badge variant={claim.status === "PENDING" ? "secondary" : claim.status === "APPROVED" ? "outline" : "destructive"}>
                    {claim.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {location ?? "Location not set"}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>Requester: {requesterLabel}</div>
                <div>Submitted: {formatDate(claim.created_at)}</div>
                <div>Reviewed: {formatDate(claim.reviewed_at)}</div>
                {claim.message ? <div>Message: {claim.message}</div> : null}
                <div className="flex flex-wrap gap-2">
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
