import { Badge } from "../ui/badge";

type ProviderState = "UNCLAIMED" | "CLAIMED_UNVERIFIED" | "VERIFIED";
type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";

type ProviderStateBadgesProps = {
  providerState: ProviderState;
  isPublished: boolean;
  claimStatus?: ClaimStatus;
  className?: string;
  showNextStep?: boolean;
};

function getProviderStateLabel(state: ProviderState) {
  switch (state) {
    case "VERIFIED":
      return "VERIFIED";
    case "CLAIMED_UNVERIFIED":
      return "CLAIMED_UNVERIFIED";
    default:
      return "UNCLAIMED";
  }
}

function getNextStep(state: ProviderState, isPublished: boolean) {
  if (state === "UNCLAIMED") {
    return "Next: Approve claim to mark claimed.";
  }
  if (state === "CLAIMED_UNVERIFIED") {
    return "Next: Verify provider to allow publishing + public media.";
  }
  if (state === "VERIFIED" && !isPublished) {
    return "Next: Publish listing to make it visible publicly.";
  }
  return "Live: Listing is public; media visible.";
}

export default function ProviderStateBadges({
  providerState,
  isPublished,
  claimStatus,
  className,
  showNextStep = true,
}: ProviderStateBadgesProps) {
  const providerVariant = providerState === "VERIFIED" ? "secondary" : "outline";
  const publishVariant = isPublished ? "secondary" : "outline";
  const claimVariant =
    claimStatus === "PENDING" ? "secondary" : claimStatus === "REJECTED" ? "destructive" : "outline";
  const nextStep = getNextStep(providerState, isPublished);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {claimStatus ? <Badge variant={claimVariant}>{claimStatus}</Badge> : null}
        <Badge variant={providerVariant}>{getProviderStateLabel(providerState)}</Badge>
        <Badge variant={publishVariant}>{isPublished ? "PUBLISHED" : "UNPUBLISHED"}</Badge>
      </div>
      {showNextStep ? <div className="mt-1 text-xs text-muted-foreground">{nextStep}</div> : null}
    </div>
  );
}
