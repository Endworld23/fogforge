import { NextResponse } from "next/server";
import { createServerSupabaseReadOnly } from "../../../lib/supabase/server";

export const revalidate = 300;

export async function GET() {
  const supabase = createServerSupabaseReadOnly();
  const { data } = await supabase
    .schema("public")
    .from("metros")
    .select("id, name, slug, state")
    .order("name", { ascending: true });

  return NextResponse.json(data ?? []);
}
