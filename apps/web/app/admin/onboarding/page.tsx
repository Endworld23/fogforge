import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { createServerSupabase, createServerSupabaseReadOnly } from "../../../lib/supabase/server";

const firstOrNull = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

async function approveRequest(formData: FormData) {
  "use server";
  const requestId = String(formData.get("request_id") ?? "");
  if (!requestId) return;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: adminRow } = await supabase
    .schema("public")
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) return;

  const { data: request } = await supabase
    .schema("public")
    .from("onboarding_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (!request || request.status !== "pending") return;

  let providerId = request.business_id as string | null;

  if (request.type === "list") {
    if (!request.business_name || !request.city || !request.state || !request.metro_id) {
      return;
    }
    const slugBase = request.business_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    let slug = slugBase;
    const { data: existing } = await supabase
      .schema("public")
      .from("providers")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      slug = `${slugBase}-${request.id.slice(0, 6)}`;
    }

    const { data: category } = await supabase
      .schema("public")
      .from("categories")
      .select("id")
      .eq("slug", "grease-trap-cleaning")
      .maybeSingle();

    if (!category?.id) {
      return;
    }

    const { data: provider } = await supabase
      .schema("public")
      .from("providers")
      .insert({
        slug,
        business_name: request.business_name,
        city: request.city,
        state: request.state,
        metro_id: request.metro_id,
        category_id: category.id,
        is_published: false,
        status: "active",
        is_claimed: true,
      })
      .select("id")
      .single();

    providerId = provider?.id ?? null;
  }

  if (!providerId) return;

  const { data: existingClaim } = await supabase
    .schema("public")
    .from("business_claims")
    .select("business_id")
    .eq("business_id", providerId)
    .maybeSingle();

  if (existingClaim) {
    await supabase
      .schema("public")
      .from("onboarding_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: "Business already claimed.",
      })
      .eq("id", requestId);
    revalidatePath("/admin/onboarding");
    return;
  }

  if (request.type === "claim") {
    await supabase
      .schema("public")
      .from("providers")
      .update({ is_claimed: true, user_id: request.user_id })
      .eq("id", providerId);
  }

  const { error: claimError } = await supabase.schema("public").from("business_claims").insert({
    business_id: providerId,
    user_id: request.user_id,
  });

  if (claimError) {
    await supabase
      .schema("public")
      .from("onboarding_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: claimError.message || "Unable to approve claim.",
      })
      .eq("id", requestId);
    revalidatePath("/admin/onboarding");
    return;
  }

  await supabase.schema("public").from("provider_users").upsert(
    {
      provider_id: providerId,
      user_id: request.user_id,
    },
    { onConflict: "user_id" }
  );

  await supabase
    .schema("public")
    .from("onboarding_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", requestId);

  revalidatePath("/admin/onboarding");
}

async function rejectRequest(formData: FormData) {
  "use server";
  const requestId = String(formData.get("request_id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!requestId) return;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: adminRow } = await supabase
    .schema("public")
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) return;

  await supabase
    .schema("public")
    .from("onboarding_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: reason || null,
    })
    .eq("id", requestId);

  revalidatePath("/admin/onboarding");
}

export default async function AdminOnboardingPage() {
  const supabase = await createServerSupabaseReadOnly();
  const { data: requests } = await supabase
    .schema("public")
    .from("onboarding_requests")
    .select(
      "id, type, status, email, full_name, phone, role_title, notes, business_id, business_name, city, state, metro:metros(name,state), provider:providers(business_name,city,state)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const requestIds = (requests ?? []).map((request) => request.id);
  const { data: documents } = requestIds.length
    ? await supabase
        .schema("public")
        .from("onboarding_documents")
        .select("onboarding_request_id, storage_path, file_name")
        .in("onboarding_request_id", requestIds)
    : { data: [] };

  const docMap = new Map<string, { url: string; label: string }[]>();
  for (const doc of documents ?? []) {
    const { data: signed } = await supabase.storage
      .from("onboarding-docs")
      .createSignedUrl(doc.storage_path, 3600);
    const list = docMap.get(doc.onboarding_request_id) ?? [];
    list.push({
      url: signed?.signedUrl ?? "#",
      label: doc.file_name ?? "Document",
    });
    docMap.set(doc.onboarding_request_id, list);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Onboarding requests</h2>
        <p className="text-sm text-muted-foreground">Review pending claim and listing requests.</p>
      </div>

      {(requests ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No pending requests.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(requests ?? []).map((request) => {
            const provider = firstOrNull(request.provider);
            const metro = firstOrNull(request.metro);
            return (
            <Card key={request.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                  {request.type === "claim" ? "Claim request" : "New listing request"}
                  <Badge variant="outline">{request.status}</Badge>
                </CardTitle>
                <CardDescription>{request.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <div>Contact: {request.full_name ?? "Unknown"}</div>
                  <div>Phone: {request.phone ?? "Not provided"}</div>
                  <div>Role: {request.role_title ?? "Not provided"}</div>
                </div>
                {request.type === "claim" ? (
                  <div>
                    Business:{" "}
                    {provider
                      ? `${provider.business_name} (${provider.city}, ${provider.state})`
                      : "Unknown"}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div>Business: {request.business_name ?? "New listing"}</div>
                    <div>
                      Location: {request.city ?? "Unknown"}, {request.state ?? ""}
                    </div>
                    <div>
                      Metro: {metro ? `${metro.name}, ${metro.state}` : "Unknown"}
                    </div>
                  </div>
                )}
                {request.notes ? <div>Notes: {request.notes}</div> : null}
                <div className="space-y-2">
                  <p className="text-sm text-foreground">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {(docMap.get(request.id) ?? []).length === 0 ? (
                      <span>No documents uploaded.</span>
                    ) : (
                      (docMap.get(request.id) ?? []).map((doc) => (
                        <Button asChild size="sm" variant="outline" key={doc.url}>
                          <Link href={doc.url} target="_blank">
                            {doc.label}
                          </Link>
                        </Button>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={approveRequest}>
                    <input type="hidden" name="request_id" value={request.id} />
                    <Button type="submit">Approve</Button>
                  </form>
                  <form action={rejectRequest} className="flex flex-wrap gap-2">
                    <input type="hidden" name="request_id" value={request.id} />
                    <Input name="reason" placeholder="Rejection reason (optional)" />
                    <Button type="submit" variant="outline">
                      Reject
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
