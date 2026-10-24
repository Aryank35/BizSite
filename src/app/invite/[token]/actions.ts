"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { acceptInvitationSchema, type AcceptInvitationInput } from "@/lib/validators/auth";
import { runAction } from "@/server/action";
import { acceptInvitation } from "@/server/services/invitations";
import { clientIpFrom, enforceThrottle, hashIdentifier } from "@/server/throttle";

export async function acceptInvitationAction(token: string, input: AcceptInvitationInput) {
  return runAction(async () => {
    const requestHeaders = await headers();
    await enforceThrottle(`invite:ip:${hashIdentifier(clientIpFrom(requestHeaders))}`, 10, 15 * 60);
    const values = acceptInvitationSchema.parse(input);
    const { email } = await acceptInvitation(String(token), values);
    // Sign the new user in; the nextCookies plugin sets the session cookie.
    await auth.api.signInEmail({ body: { email, password: values.password }, headers: requestHeaders });
    return null;
  });
}
