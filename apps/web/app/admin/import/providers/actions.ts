"use server";

import { createClient } from "@supabase/supabase-js";
import { slugify } from "../../../../lib/slugify";

type ImportRow = {
  business_name: string;
  city: string;
  state: string;
  metro_slug: string;
  category: string;
  phone?: string;
  website_url?: string;
  email_public?: string;
  description?: string;
  street?: string;
  postal_code?: string;
};

type ImportResult = {
  ok: boolean;
  message?: string;
  inserted: number;
  updated: number;
  failed: number;
  rowErrors: Array<{ index: number; error: string }>;
};

function createRlsClient(accessToken: string) {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  }) as unknown as {
    from: (table: string) => any;
    auth: { getUser: () => Promise<any> };
  };
}

async function ensureUniqueSlug(baseSlug: string, supabase: { from: (table: string) => any }) {
  if (!baseSlug) {
    baseSlug = "provider";
  }
  const { data, error } = await supabase
    .from("providers")
    .select("slug")
    .like("slug", `${baseSlug}%`);

  if (error || !data) {
    return baseSlug;
  }

  const rows = (data ?? []) as Array<{ slug: string }>;
  const existing = new Set(rows.map((row) => row.slug));
  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  while (existing.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }
  return `${baseSlug}-${counter}`;
}

async function resolveLookupIds(supabase: { from: (table: string) => any }, rows: ImportRow[]) {
  const metroSlugs = Array.from(new Set(rows.map((row) => row.metro_slug)));
  const categorySlugs = Array.from(new Set(rows.map((row) => row.category)));

  const [{ data: metros }, { data: categories }] = await Promise.all([
    supabase.from("metros").select("id, slug").in("slug", metroSlugs),
    supabase.from("categories").select("id, slug").in("slug", categorySlugs),
  ]);

  const metroRows = (metros ?? []) as Array<{ id: string; slug: string }>;
  const categoryRows = (categories ?? []) as Array<{ id: string; slug: string }>;
  const metroMap = new Map(metroRows.map((metro) => [metro.slug, metro.id]));
  const categoryMap = new Map(categoryRows.map((category) => [category.slug, category.id]));

  return { metroMap, categoryMap };
}

async function applyUpsert(
  supabase: { from: (table: string) => any },
  row: ImportRow,
  metroId: string,
  categoryId: string
) {
  const baseSlug = slugify(`${row.business_name}-${row.city}-${row.state}`);
  const { data: slugMatch } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", baseSlug)
    .maybeSingle();
  const slugRow = (slugMatch ?? null) as { id: string; slug: string } | null;

  const payload = {
    business_name: row.business_name,
    city: row.city,
    state: row.state,
    metro_id: metroId,
    category_id: categoryId,
    phone: row.phone || null,
    website_url: row.website_url || null,
    email_public: row.email_public || null,
    description: row.description || null,
    street: row.street || null,
    postal_code: row.postal_code || null,
  };

  if (slugRow?.id) {
    const { error } = await supabase
      .from("providers")
      .update(payload as Record<string, unknown>)
      .eq("id", slugRow.id);
    if (error) {
      return { status: "failed" as const, error: error.message };
    }
    return { status: "updated" as const };
  }

  if (row.phone) {
    const { data: phoneMatch } = await supabase
      .from("providers")
      .select("id, slug")
      .eq("business_name", row.business_name)
      .eq("phone", row.phone)
      .eq("city", row.city)
      .eq("state", row.state)
      .maybeSingle();
    const phoneRow = (phoneMatch ?? null) as { id: string; slug: string } | null;

    if (phoneRow?.id) {
      const { error } = await supabase
        .from("providers")
        .update(payload as Record<string, unknown>)
        .eq("id", phoneRow.id);
      if (error) {
        return { status: "failed" as const, error: error.message };
      }
      return { status: "updated" as const };
    }
  }

  const uniqueSlug = await ensureUniqueSlug(baseSlug, supabase);
  const { error } = await supabase.from("providers").insert({
    ...(payload as Record<string, unknown>),
    slug: uniqueSlug,
    is_published: true,
    status: "active",
  });

  if (error) {
    return { status: "failed" as const, error: error.message };
  }

  return { status: "inserted" as const };
}

export async function importProvidersAction(formData: FormData): Promise<ImportResult> {
  const payload = formData.get("payload");
  const accessToken = formData.get("accessToken");

  if (typeof payload !== "string" || typeof accessToken !== "string") {
    return {
      ok: false,
      message: "Missing payload or access token.",
      inserted: 0,
      updated: 0,
      failed: 0,
      rowErrors: [],
    };
  }

  const rows = JSON.parse(payload) as ImportRow[];
  const supabase = createRlsClient(accessToken);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      ok: false,
      message: "Not authenticated.",
      inserted: 0,
      updated: 0,
      failed: rows.length,
      rowErrors: rows.map((_, index) => ({ index, error: "Not authenticated." })),
    };
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    return {
      ok: false,
      message: "Not authorized.",
      inserted: 0,
      updated: 0,
      failed: rows.length,
      rowErrors: rows.map((_, index) => ({ index, error: "Not authorized." })),
    };
  }

  const { metroMap, categoryMap } = await resolveLookupIds(supabase, rows);
  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const rowErrors: ImportResult["rowErrors"] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const metroId = metroMap.get(row.metro_slug);
    const categoryId = categoryMap.get(row.category);

    if (!metroId || !categoryId) {
      failed += 1;
      rowErrors.push({
        index,
        error: "Invalid metro or category.",
      });
      continue;
    }

    const result = await applyUpsert(supabase, row, metroId, categoryId);
    if (result.status === "inserted") {
      inserted += 1;
    } else if (result.status === "updated") {
      updated += 1;
    } else {
      failed += 1;
      rowErrors.push({ index, error: result.error });
    }
  }

  return {
    ok: failed === 0,
    inserted,
    updated,
    failed,
    rowErrors,
  };
}
