import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { getProviderState } from "../../../../lib/providers/providerState";
import { isAdminServer } from "../../../../lib/auth/isAdminServer";
import { createServerSupabaseReadOnly } from "../../../../lib/supabase/server";
import ClaimReviewClient from "./ClaimReviewClient";

export const dynamic = "force-dynamic";

type ClaimDetailPageProps = {
  params: Promise<{ id: string }>;
};

type ClaimRow = {
  id: string;
  provider_id: string;
  requester_user_id: string;
  requester_email: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
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
    id: string;
    slug: string | null;
    business_name: string;
    city: string | null;
    state: string | null;
    status: string | null;
    is_published: boolean | null;
    claim_status: string | null;
    verified_at: string | null;
    claimed_by_user_id: string | null;
    is_claimed: boolean | null;
    user_id: string | null;
    metros: { name: string; slug: string; state: string }[] | null;
  } | null;
  documents: { id: string; doc_type: string; file_url: string }[];
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

export default async function AdminClaimDetailPage({ params }: ClaimDetailPageProps) {
  const resolvedParams = await params;
  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseReadOnly();
  const { data: claim } = await supabase
    .schema("public")
    .from("provider_claim_requests")
    .select(
      "id, provider_id, requester_user_id, requester_email, status, message, created_at, reviewed_at, reviewed_by, claimant_first_name, claimant_last_name, claimant_phone, claimant_role, claimant_role_other, claimant_address_line1, claimant_address_line2, claimant_city, claimant_state, claimant_zip, provider:providers(id, slug, business_name, city, state, status, is_published, claim_status, verified_at, claimed_by_user_id, is_claimed, user_id, metros(name, slug, state)), documents:provider_claim_request_documents(id, doc_type, file_url)"
    )
    .eq("id", resolvedParams.id)
    .maybeSingle();

  if (!claim) {
    notFound();
  }

  const row: ClaimRow = {
    id: claim.id,
    provider_id: claim.provider_id,
    requester_user_id: claim.requester_user_id,
    requester_email: claim.requester_email ?? null,
    status: claim.status,
    message: claim.message ?? null,
    created_at: claim.created_at,
    reviewed_at: claim.reviewed_at ?? null,
    reviewed_by: claim.reviewed_by ?? null,
    claimant_first_name: claim.claimant_first_name ?? null,
    claimant_last_name: claim.claimant_last_name ?? null,
    claimant_phone: claim.claimant_phone ?? null,
    claimant_role: claim.claimant_role ?? null,
    claimant_role_other: claim.claimant_role_other ?? null,
    claimant_address_line1: claim.claimant_address_line1 ?? null,
    claimant_address_line2: claim.claimant_address_line2 ?? null,
    claimant_city: claim.claimant_city ?? null,
    claimant_state: claim.claimant_state ?? null,
    claimant_zip: claim.claimant_zip ?? null,
    provider: claim.provider?.[0] ?? null,
    documents: claim.documents ?? [],
  };

  const provider = row.provider;
  const providerState = provider
    ? getProviderState({
        claim_status: provider.claim_status ?? null,
        verified_at: provider.verified_at ?? null,
        claimed_by_user_id: provider.claimed_by_user_id ?? null,
        is_claimed: provider.is_claimed ?? null,
        user_id: provider.user_id ?? null,
      })
    : "UNCLAIMED";
  const claimantName = [row.claimant_first_name, row.claimant_last_name]
    .filter(Boolean)
    .join(" ");
  const metro = provider?.metros?.[0]
    ? `${provider.metros[0].name}, ${provider.metros[0].state}`
    : null;
  const location =
    metro ??
    (provider?.city && provider?.state ? `${provider.city}, ${provider.state}` : null);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={provider?.business_name ?? "Claim request"}
        description={location ?? `Claim request ${row.id}`}
        action={
          <Button asChild variant="outline">
            <Link href="/admin/claims">Back to claims</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={
            row.status === "PENDING"
              ? "secondary"
              : row.status === "APPROVED"
                ? "outline"
                : "destructive"
          }
        >
          {row.status}
        </Badge>
        <Badge variant="outline">Provider: {providerState}</Badge>
        {provider?.is_published != null ? (
          <Badge variant={provider.is_published ? "secondary" : "outline"}>
            {provider.is_published ? "Published" : "Draft"}
          </Badge>
        ) : null}
        {provider?.status ? <Badge variant="outline">{provider.status}</Badge> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider summary</CardTitle>
          <CardDescription>Listing details and claim state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>Provider: {provider?.business_name ?? "Not found"}</div>
          <div>Metro: {metro ?? "Not set"}</div>
          <div>Location: {location ?? "Not set"}</div>
          <div>Claim status: {provider?.claim_status ?? "Not set"}</div>
          <div>Verified at: {formatDate(provider?.verified_at ?? null)}</div>
          {provider?.slug ? (
            <div>
              Admin listing: {" "}
              <Link className="text-primary underline-offset-4 hover:underline" href={`/admin/providers/${provider.slug}`}>
                View provider
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claimant</CardTitle>
          <CardDescription>Submitted identity and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
          <div className="space-y-2">
            <div>Name: {claimantName || "—"}</div>
            <div>Email: {row.requester_email ?? row.requester_user_id}</div>
            <div>Phone: {row.claimant_phone ?? "—"}</div>
            <div>
              Role:{" "}
              {row.claimant_role
                ? `${row.claimant_role}${
                    row.claimant_role === "Other" && row.claimant_role_other
                      ? ` (${row.claimant_role_other})`
                      : ""
                  }`
                : "—"}
            </div>
          </div>
          <div className="space-y-2">
            <div>Address: {formatAddress(row)}</div>
            <div>Submitted: {formatDate(row.created_at)}</div>
            <div>Reviewed: {formatDate(row.reviewed_at)}</div>
            <div>Reviewed by: {row.reviewed_by ?? "—"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request message</CardTitle>
          <CardDescription>Why they are claiming the listing.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-foreground">
          {row.message ? <p className="whitespace-pre-wrap">{row.message}</p> : "No message provided."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Uploaded proof of ownership.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {row.documents.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {row.documents.map((doc) => (
                <div key={doc.id} className="space-y-2">
                  <div className="font-medium text-foreground">{doc.doc_type}</div>
                  {/(\.png|\.jpe?g|\.gif|\.webp)$/i.test(doc.file_url) ? (
                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                      <Image
                        src={doc.file_url}
                        alt={doc.doc_type}
                        width={320}
                        height={200}
                        className="h-auto max-h-56 w-auto max-w-full rounded-md border border-border"
                        unoptimized
                      />
                    </a>
                  ) : (
                    <a
                      className="text-primary underline-offset-4 hover:underline"
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open document
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>No documents uploaded.</div>
          )}
        </CardContent>
      </Card>

      {provider ? (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Approve, reject, verify, or publish this provider.</CardDescription>
          </CardHeader>
          <CardContent>
            <ClaimReviewClient
              claimId={row.id}
              providerId={provider.id}
              claimStatus={row.status}
              reviewedAt={row.reviewed_at}
              providerState={providerState}
              isPublished={Boolean(provider.is_published)}
              verifiedAt={provider.verified_at ?? null}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
