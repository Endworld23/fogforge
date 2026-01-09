import { NextResponse } from "next/server";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";

export const revalidate = 300;
export const runtime = "nodejs";

export async function GET() {
  const supabase = await createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("metros")
    .select("id, name, slug, state")
    .order("name", { ascending: true });

  return NextResponse.json(data ?? []);
}
