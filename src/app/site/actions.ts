"use server";

import { headers } from "next/headers";
import type { PublicEnquiryInput, WebsiteRequestInput } from "@/lib/validators/enquiry";
import { runAction } from "@/server/action";
import { submitPublicEnquiry } from "@/server/services/enquiries";
import { submitWebsiteRequest } from "@/server/services/website-requests";
import { clientIpFrom, hashIdentifier } from "@/server/throttle";

/** Public: enquiry from a business website. The business is resolved from its slug server-side. */
export async function submitEnquiryAction(input: PublicEnquiryInput) {
  return runAction(async () => {
    const clientKey = hashIdentifier(clientIpFrom(await headers()));
    await submitPublicEnquiry(input, clientKey);
    // The same response is returned whether or not the honeypot tripped.
    return null;
  });
}

/** Public: "request a website" form on the marketing site. */
export async function submitWebsiteRequestAction(input: WebsiteRequestInput) {
  return runAction(async () => {
    const clientKey = hashIdentifier(clientIpFrom(await headers()));
    await submitWebsiteRequest(input, clientKey);
    return null;
  });
}
