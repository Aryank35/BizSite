"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import type { BusinessCreateInput, BusinessPlatformSettingsInput, InviteAdminInput } from "@/lib/validators/business";
import { runAction } from "@/server/action";
import { NotFoundError } from "@/server/errors";
import { ACTIVE_BUSINESS_COOKIE, requireSuperAdmin } from "@/server/session";
import {
  createBusiness,
  deleteBusiness,
  inviteBusinessAdmin,
  removeBusinessMember,
  revokeInvitation,
  setBusinessStatus,
  setUserStatus,
  startManagingBusiness,
  updateBusinessPlatformSettings,
} from "@/server/services/businesses";
import { updatePlatformSettings, updateTemplateAvailability } from "@/server/services/platform";
import { setWebsiteRequestHandled } from "@/server/services/website-requests";
import { publishWebsite, unpublishWebsite } from "@/server/services/website";
import { resolveTenantContext } from "@/server/tenant";

const id = z.string().min(1).max(64);

export async function createBusinessAction(input: BusinessCreateInput) {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    const business = await createBusiness(actor, input);
    return { id: business.id };
  });
}

export async function updateBusinessSettingsAction(businessId: string, input: BusinessPlatformSettingsInput) {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    await updateBusinessPlatformSettings(actor, id.parse(businessId), input);
    refresh();
    return null;
  });
}

export async function setBusinessStatusAction(businessId: string, status: "ACTIVE" | "SUSPENDED") {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    await setBusinessStatus(actor, id.parse(businessId), status);
    refresh();
    return null;
  });
}

export async function deleteBusinessAction(businessId: string, confirmSlug: string) {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    await deleteBusiness(actor, id.parse(businessId), String(confirmSlug));
    return null;
  });
}

export async function inviteAdminAction(businessId: string, input: InviteAdminInput) {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    const result = await inviteBusinessAdmin(actor, id.parse(businessId), input);
    refresh();
    return result.kind === "invited"
      ? { kind: result.kind, inviteUrl: `${env.APP_URL}/invite/${result.token}` }
      : { kind: result.kind, inviteUrl: null };
  });
}

export async function revokeInvitationAction(businessId: string, invitationId: string) {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    await revokeInvitation(actor, id.parse(businessId), id.parse(invitationId));
    refresh();
    return null;
  });
}

export async function removeMemberAction(businessId: string, userId: string) {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    await removeBusinessMember(actor, id.parse(businessId), id.parse(userId));
    refresh();
    return null;
  });
}

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "SUSPENDED") {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    await setUserStatus(actor, id.parse(userId), z.enum(["ACTIVE", "SUSPENDED"]).parse(status));
    refresh();
    return null;
  });
}

async function adminTenant(businessId: string) {
  const actor = await requireSuperAdmin();
  const ctx = await resolveTenantContext(actor, id.parse(businessId));
  if (!ctx) throw new NotFoundError("Business");
  return ctx;
}

export async function publishBusinessWebsiteAction(businessId: string) {
  return runAction(async () => {
    await publishWebsite(await adminTenant(businessId));
    refresh();
    return null;
  });
}

export async function unpublishBusinessWebsiteAction(businessId: string) {
  return runAction(async () => {
    await unpublishWebsite(await adminTenant(businessId));
    refresh();
    return null;
  });
}

/** Opens the business dashboard for this business as the super admin. */
export async function manageBusinessAction(businessId: string, destination: "dashboard" | "preview" = "dashboard") {
  const actor = await requireSuperAdmin();
  const business = await startManagingBusiness(actor, id.parse(businessId));
  (await cookies()).set(ACTIVE_BUSINESS_COOKIE, business.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect(destination === "preview" ? `/preview/${business.id}` : "/dashboard");
}

export async function updatePlatformSettingsAction(input: unknown) {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    await updatePlatformSettings(actor, input);
    refresh();
    return null;
  });
}

export async function updateTemplateAvailabilityAction(input: unknown) {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    await updateTemplateAvailability(actor, input);
    refresh();
    return null;
  });
}

export async function setWebsiteRequestHandledAction(requestId: string, handled: boolean) {
  return runAction(async () => {
    await requireSuperAdmin();
    await setWebsiteRequestHandled(id.parse(requestId), Boolean(handled));
    refresh();
    return null;
  });
}
