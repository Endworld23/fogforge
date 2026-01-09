import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedOutCookie = request.cookies.get("ff-logged-out");
  const hasLoggedOutFlag = Boolean(loggedOutCookie);

  if (hasLoggedOutFlag) {
    const response = NextResponse.next();
    response.cookies.delete("ff-logged-out");
    response.cookies.set({
      name: "ff-logged-out",
      value: "",
      maxAge: 0,
      path: "/",
      expires: new Date(0),
      sameSite: "lax",
    });
    return response;
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname) && !hasAuthCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname === "/login") return true;
  if (pathname === "/logout") return true;
  if (pathname === "/get-started") return true;
  if (pathname === "/onboarding") return true;
  if (pathname === "/onboarding/status") return true;
  if (pathname === "/healthz") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  if (pathname === "/api/metros") return true;
  if (pathname === "/post-login") return true;
  if (pathname === "/post-logout") return true;
  if (pathname.startsWith("/grease-trap-cleaning")) return true;
  return false;
}

function isProtectedPath(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/")
  );
}

function hasAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}
