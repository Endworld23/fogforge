import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function handleLogout(request: Request) {
  const url = new URL(request.url);
  console.info("logout request", request.method, url.pathname);
  const cookieStore = cookies();
  const response = NextResponse.redirect(new URL("/post-logout", request.url), 303);
  response.headers.set("X-FF-LOGOUT", "1");
  response.headers.set("Cache-Control", "no-store");

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  await supabase.auth.signOut();

  response.cookies.set({
    name: "ff-logged-out",
    value: "1",
    maxAge: 20,
    path: "/",
    sameSite: "lax",
  });

  const supabaseCookieNames = cookieStore
    .getAll()
    .map(({ name }) => name)
    .filter((name) => name.startsWith("sb-"));

  supabaseCookieNames.forEach((name) => {
    response.cookies.delete(name);
    response.cookies.set({
      name,
      value: "",
      maxAge: 0,
      path: "/",
      expires: new Date(0),
      sameSite: "lax",
    });
  });
  return response;
}

export async function GET(request: Request) {
  return handleLogout(request);
}

export async function POST(request: Request) {
  return handleLogout(request);
}
