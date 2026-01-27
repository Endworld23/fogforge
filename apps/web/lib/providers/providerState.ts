import "server-only";

export type ProviderState = "UNCLAIMED" | "CLAIMED_UNVERIFIED" | "VERIFIED";

type ProviderStateInput = {
  claim_status?: string | null;
  verified_at?: string | null;
  claimed_by_user_id?: string | null;
  is_claimed?: boolean | null;
  user_id?: string | null;
};

export function getProviderState(input: ProviderStateInput): ProviderState {
  if (input.verified_at) {
    return "VERIFIED";
  }

  if (input.user_id) {
    return "VERIFIED";
  }

  const claimStatus = input.claim_status?.toLowerCase();
  if (claimStatus === "claimed" || claimStatus === "claimed_unverified" || claimStatus === "claimed-unverified") {
    return "CLAIMED_UNVERIFIED";
  }
  if (claimStatus === "unclaimed") {
    return input.is_claimed || input.claimed_by_user_id ? "CLAIMED_UNVERIFIED" : "UNCLAIMED";
  }
  if (input.is_claimed || input.claimed_by_user_id) {
    return "CLAIMED_UNVERIFIED";
  }

  return "UNCLAIMED";
}
