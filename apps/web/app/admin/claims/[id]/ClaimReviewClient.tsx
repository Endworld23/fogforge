"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import { approveClaimRequestAction, rejectClaimRequestAction, verifyProviderFromClaimAction } from "../actions";
import { updateProviderPublishAction } from "../../providers/actions";

type ClaimReviewClientProps = {
  claimId: string;
  providerId: string;
  claimStatus: "PENDING" | "APPROVED" | "REJECTED";
  reviewedAt: string | null;
  providerState: "UNCLAIMED" | "CLAIMED_UNVERIFIED" | "VERIFIED";
  isPublished: boolean;
  verifiedAt: string | null;
};

export default function ClaimReviewClient({
  claimId,
  providerId,
  claimStatus,
  reviewedAt,
  providerState,
  isPublished,
  verifiedAt,
}: ClaimReviewClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(claimStatus);
  const [reviewedAtLocal, setReviewedAtLocal] = useState(reviewedAt);
  const [providerStateLocal, setProviderStateLocal] = useState(providerState);
  const [published, setPublished] = useState(isPublished);
  const [verifiedAtLocal, setVerifiedAtLocal] = useState(verifiedAt);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canApprove = status === "PENDING";
  const canReject = status === "PENDING";
  const canVerify = status === "APPROVED" && providerStateLocal !== "VERIFIED";
  const canTogglePublish = providerStateLocal === "VERIFIED";

  const handleApprove = () => {
    startTransition(async () => {
      setNotice(null);
      const result = await approveClaimRequestAction(claimId);
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      const now = new Date().toISOString();
      setStatus("APPROVED");
      setReviewedAtLocal(now);
      setNotice(result.message);
      router.refresh();
    });
  };

  const handleReject = () => {
    if (!confirm("Reject this claim request?")) return;
    startTransition(async () => {
      setNotice(null);
      const result = await rejectClaimRequestAction(claimId);
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      const now = new Date().toISOString();
      setStatus("REJECTED");
      setReviewedAtLocal(now);
      setNotice(result.message);
      router.refresh();
    });
  };

  const handleVerify = () => {
    startTransition(async () => {
      setNotice(null);
      const result = await verifyProviderFromClaimAction(providerId);
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      const now = new Date().toISOString();
      setProviderStateLocal("VERIFIED");
      setVerifiedAtLocal(now);
      setNotice(result.message);
      router.refresh();
    });
  };

  const handlePublishToggle = (nextValue: boolean) => {
    if (!nextValue && !confirm("Unpublish this provider listing?")) return;
    startTransition(async () => {
      setNotice(null);
      const result = await updateProviderPublishAction(providerId, nextValue);
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      setPublished(Boolean(result.is_published));
      setNotice(result.message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      {notice ? <div className="text-sm text-muted-foreground">{notice}</div> : null}
      <div className="text-xs text-muted-foreground">
        Reviewed: {reviewedAtLocal ? new Date(reviewedAtLocal).toLocaleString() : "—"}
      </div>
      <div className="text-xs text-muted-foreground">
        Verified: {verifiedAtLocal ? new Date(verifiedAtLocal).toLocaleString() : "—"}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleApprove} disabled={isPending || !canApprove}>
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={isPending || !canReject}
        >
          Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleVerify}
          disabled={isPending || !canVerify}
        >
          Verify provider
        </Button>
        <Button
          size="sm"
          variant={published ? "outline" : "default"}
          onClick={() => handlePublishToggle(!published)}
          disabled={isPending || !canTogglePublish}
        >
          {published ? "Unpublish" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
