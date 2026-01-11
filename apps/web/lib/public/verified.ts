type ProviderVerifiedInput = {
  phone?: string | null;
  website_url?: string | null;
};

export function isProviderVerified(input: ProviderVerifiedInput): boolean {
  return Boolean(input.phone?.trim() || input.website_url?.trim());
}
