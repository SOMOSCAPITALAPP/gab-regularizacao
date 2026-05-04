import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const isAuthenticated = request.cookies.get("gab_session")?.value === "authenticated";
  const isLogin = request.nextUrl.pathname === "/login";

  if (!isAuthenticated && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/login|api/logout|_next/static|_next/image|favicon.ico).*)"],
};
