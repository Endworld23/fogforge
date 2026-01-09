import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function proxy(request: NextRequest) {
  const loggedOutCookie = request.cookies.get("ff-logged-out");
  const hasLoggedOutFlag = Boolean(loggedOutCookie);
  if (request.nextUrl.pathname.startsWith("/logout")) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
  if (hasLoggedOutFlag) {
    console.info(
      "middleware skip refresh: ff-logged-out",
      request.nextUrl.pathname,
      loggedOutCookie?.value ?? ""
    );
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
    response.cookies.delete("ff-logged-out");
    response.cookies.set({
      name: "ff-logged-out",
      value: "",
      maxAge: 0,
      path: "/",
      expires: new Date(0),
      sameSite: "lax",
    });
    console.info("middleware cleared ff-logged-out");
    return response;
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const hasSupabaseCookies = request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
  if (!hasSupabaseCookies) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
