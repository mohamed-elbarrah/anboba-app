import { NextResponse, type NextRequest } from "next/server";

/** Optimistic auth redirect only. Secure session validation lives in the DAL/layout/actions. */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSession = request.cookies.has("anboba_session") || request.cookies.has("__Host-anboba_session");
  if (path.startsWith("/dashboard") && !hasSession) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`, request.url));
  if (path === "/login" && hasSession) return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/login"] };
