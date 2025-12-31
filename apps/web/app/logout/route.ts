import { NextResponse } from "next/server";
import { createServerSupabase } from "../../lib/supabase/server";

async function handleLogout(request: Request) {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  return handleLogout(request);
}

export async function POST(request: Request) {
  return handleLogout(request);
}
