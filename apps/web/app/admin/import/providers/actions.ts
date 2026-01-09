"use server";

import { createClient, type SupabaseClient as SBClient } from "@supabase/supabase-js";
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ProviderRow = {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  state: string;
  metro_id: string;
  category_id: string;
  phone: string | null;
  website_url: string | null;
  email_public: string | null;
  description: string | null;
  street: string | null;
  postal_code: string | null;
  is_published: boolean;
  status: string;
};

type ProviderInsert = {
  slug: string;
  business_name: string;
  city: string;
  state: string;
  metro_id: string;
  category_id: string;
  phone?: string | null;
  website_url?: string | null;
  email_public?: string | null;
  description?: string | null;
  street?: string | null;
  postal_code?: string | null;
  is_published: boolean;
  status: string;
  is_claimed?: boolean | null;
  user_id?: string | null;
};

type ProviderUpdate = {
  slug?: string;
  business_name?: string;
  city?: string;
  state?: string;
  metro_id?: string;
  category_id?: string;
  phone?: string | null;
  website_url?: string | null;
  email_public?: string | null;
  description?: string | null;
  street?: string | null;
  postal_code?: string | null;
  is_published?: boolean;
  status?: string;
  is_claimed?: boolean | null;
  user_id?: string | null;
};

type ProviderWriteBase = Pick<
  ProviderInsert,
  | "business_name"
  | "city"
  | "state"
  | "metro_id"
  | "category_id"
  | "phone"
  | "website_url"
  | "email_public"
  | "description"
  | "street"
  | "postal_code"
>;

type Database = {
  public: {
    Tables: {
      providers: {
        Row: ProviderRow;
        Insert: ProviderInsert;
        Update: ProviderUpdate;
        Relationships: [];
      };
      metros: {
        Row: { id: string; slug: string };
        Insert: { id?: string; slug: string };
        Update: { slug?: string };
        Relationships: [];
      };
      categories: {
        Row: { id: string; slug: string };
        Insert: { id?: string; slug: string };
        Update: { slug?: string };
        Relationships: [];
      };
      admins: {
        Row: { user_id: string };
        Insert: { user_id: string };
        Update: { user_id?: string };
        Relationships: [];
      };
    };
    Views: Record<
      string,
      {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      }
    >;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, unknown>;
  };
};

type ImportResult = {
  ok: boolean;
  message?: string;
  inserted: number;
  updated: number;
  failed: number;
  rowErrors: Array<{ index: number; error: string }>;
};

type SupabaseClient = SBClient<Database, "public">;

type SelectResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type MaybeSingleResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type UserResult = {
  data: { user: { id: string } | null };
  error: { message: string } | null;
};

function createRlsClient(accessToken: string): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

async function ensureUniqueSlug(baseSlug: string, supabase: SupabaseClient) {
  if (!baseSlug) {
    baseSlug = "provider";
  }
  const { data, error } = (await supabase
    .from("providers")
    .select("slug")
    .like("slug", `${baseSlug}%`)) as SelectResult<Array<{ slug: string }>>;

  if (error || !data) {
    return baseSlug;
  }

  const existing = new Set(data.map((row) => row.slug));
  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  while (existing.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }
  return `${baseSlug}-${counter}`;
}

async function resolveLookupIds(supabase: SupabaseClient, rows: ImportRow[]) {
  const metroSlugs = Array.from(new Set(rows.map((row) => row.metro_slug)));
  const categorySlugs = Array.from(new Set(rows.map((row) => row.category)));

  const [
    { data: metros },
    { data: categories },
  ] = (await Promise.all([
    supabase.from("metros").select("id, slug").in("slug", metroSlugs),
    supabase.from("categories").select("id, slug").in("slug", categorySlugs),
  ])) as [
    SelectResult<Array<{ id: string; slug: string }>>,
    SelectResult<Array<{ id: string; slug: string }>>
  ];

  const metroRows = metros ?? [];
  const categoryRows = categories ?? [];
  const metroMap = new Map(metroRows.map((metro) => [metro.slug, metro.id]));
  const categoryMap = new Map(categoryRows.map((category) => [category.slug, category.id]));

  return { metroMap, categoryMap };
}

async function applyUpsert(
  supabase: SupabaseClient,
  row: ImportRow,
  metroId: string,
  categoryId: string
) {
  const baseSlug = slugify(`${row.business_name}-${row.city}-${row.state}`);
  const { data: slugMatch } = (await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", baseSlug)
    .maybeSingle()) as MaybeSingleResult<{ id: string; slug: string }>;

  const baseWrite: ProviderWriteBase = {
    business_name: row.business_name,
    city: row.city,
    state: row.state,
    metro_id: metroId,
    category_id: categoryId,
    phone: row.phone ?? null,
    website_url: row.website_url ?? null,
    email_public: row.email_public ?? null,
    description: row.description ?? null,
    street: row.street ?? null,
    postal_code: row.postal_code ?? null,
  };
  const updatePayload: ProviderUpdate = baseWrite;

  if (slugMatch?.id) {
    const { error } = await supabase
      .from("providers")
      .update(updatePayload)
      .eq("id", slugMatch.id);
    if (error) {
      return { status: "failed" as const, error: error.message };
    }
    return { status: "updated" as const };
  }

  if (row.phone) {
    const { data: phoneMatch } = (await supabase
      .from("providers")
      .select("id, slug")
      .eq("business_name", row.business_name)
      .eq("phone", row.phone)
      .eq("city", row.city)
      .eq("state", row.state)
      .maybeSingle()) as MaybeSingleResult<{ id: string; slug: string }>;

    if (phoneMatch?.id) {
      const { error } = await supabase
        .from("providers")
        .update(updatePayload)
        .eq("id", phoneMatch.id);
      if (error) {
        return { status: "failed" as const, error: error.message };
      }
      return { status: "updated" as const };
    }
  }

  const uniqueSlug = await ensureUniqueSlug(baseSlug, supabase);
  const insertPayload: ProviderInsert = {
    ...baseWrite,
    slug: uniqueSlug,
    is_published: true,
    status: "active",
  };
  const { error } = await supabase.from("providers").insert(insertPayload);

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
  const { data: userData, error: userError } =
    (await supabase.auth.getUser()) as UserResult;

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

  const { data: adminRow, error: adminError } = (await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle()) as MaybeSingleResult<{ user_id: string }>;

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
