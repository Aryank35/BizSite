import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { SUBDOMAIN_HEADER } from "@/lib/site-url";

const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api"]);

/**
 * Runs before routing:
 * 1. Optional tenant subdomains: <slug>.<TENANT_ROOT_DOMAIN>/... is served by /site/<slug>/...
 * 2. Optimistic auth redirect for private areas when no session cookie exists.
 *    This is only a fast path — every page and action still authorises on the server.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const rootDomain = process.env.TENANT_ROOT_DOMAIN;
  if (rootDomain) {
    const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
    if (host.endsWith(`.${rootDomain}`)) {
      const sub = host.slice(0, -(rootDomain.length + 1));
      if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sub) && !RESERVED_SUBDOMAINS.has(sub) && !pathname.startsWith("/_next")) {
        const headers = new Headers(request.headers);
        headers.set(SUBDOMAIN_HEADER, sub);
        const target = new URL(`/site/${sub}${pathname === "/" ? "" : pathname}${search}`, request.url);
        return NextResponse.rewrite(target, { request: { headers } });
      }
    }
  }

  const isPrivate = pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/preview");
  if (isPrivate && !getSessionCookie(request)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  // The subdomain header is only trusted when set by the rewrite above.
  if (request.headers.has(SUBDOMAIN_HEADER)) {
    const headers = new Headers(request.headers);
    headers.delete(SUBDOMAIN_HEADER);
    return NextResponse.next({ request: { headers } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|media/|api/).*)"],
};
