import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/session";

/** Sends a freshly signed-in user to the right area for their role. */
export async function GET(request: Request) {
  const user = await getSessionUser();
  const target = !user ? "/login" : user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
  return NextResponse.redirect(new URL(target, request.url));
}
