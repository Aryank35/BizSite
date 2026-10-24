import { verifyPassword } from "better-auth/crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors";
import { createBusiness, deleteBusiness, inviteBusinessAdmin, setUserStatus } from "@/server/services/businesses";
import { acceptInvitation, getInvitationPreview } from "@/server/services/invitations";
import { resolveTenantContext, type SessionUser } from "@/server/tenant";
import { createSuperAdmin, resetDatabase } from "./helpers";

let admin: SessionUser;
let businessId: string;

beforeAll(async () => {
  await resetDatabase();
  admin = await createSuperAdmin();
  const business = await createBusiness(admin, {
    name: "Invite Test Interiors",
    slug: "invite-test-interiors",
    category: "interior-design",
    description: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    city: "Puri",
    state: "Odisha",
  });
  businessId = business.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("business creation", () => {
  it("creates a starter website with every section and an audit entry", async () => {
    expect(await prisma.websiteSection.count({ where: { businessId } })).toBe(14);
    expect(await prisma.websiteConfig.findUnique({ where: { businessId } })).not.toBeNull();
    expect(await prisma.auditLog.count({ where: { businessId, action: "business.created" } })).toBe(1);
  });

  it("rejects a duplicate web address", async () => {
    await expect(
      createBusiness(admin, { name: "Dup", slug: "invite-test-interiors", category: "other", description: "", email: "", phone: "", whatsappNumber: "", city: "", state: "" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("invitations", () => {
  let token: string;

  it("invites a new administrator with a single-use token", async () => {
    const result = await inviteBusinessAdmin(admin, businessId, { email: "Owner@Interiors.Example", name: "", role: "OWNER" });
    expect(result.kind).toBe("invited");
    token = (result as { token: string }).token;
    const stored = await prisma.invitation.findFirstOrThrow({ where: { businessId } });
    expect(stored.email).toBe("owner@interiors.example");
    expect(stored.tokenHash).not.toBe(token); // only a hash is stored
    expect(await getInvitationPreview(token)).toMatchObject({ businessName: "Invite Test Interiors" });
  });

  it("accepting creates an account with a hashed password and a membership", async () => {
    await acceptInvitation(token, { name: "Priya Owner", password: "a-long-password", confirmPassword: "a-long-password" });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "owner@interiors.example" }, include: { accounts: true } });
    expect(user.role).toBe("BUSINESS_ADMIN");
    const hash = user.accounts[0].password!;
    expect(hash).not.toContain("a-long-password");
    expect(await verifyPassword({ hash, password: "a-long-password" })).toBe(true);

    const ctx = await resolveTenantContext({ id: user.id, name: user.name, email: user.email, role: user.role }, null);
    expect(ctx?.businessId).toBe(businessId);
    expect(ctx?.membershipRole).toBe("OWNER");
  });

  it("cannot be reused", async () => {
    expect(await getInvitationPreview(token)).toBeNull();
    await expect(acceptInvitation(token, { name: "Again", password: "a-long-password", confirmPassword: "a-long-password" })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("enforces password rules", async () => {
    const result = await inviteBusinessAdmin(admin, businessId, { email: "second@interiors.example", name: "", role: "EDITOR" });
    const second = (result as { token: string }).token;
    await expect(acceptInvitation(second, { name: "Short", password: "short", confirmPassword: "short" })).rejects.toThrow();
  });

  it("expired invitations are rejected", async () => {
    const result = await inviteBusinessAdmin(admin, businessId, { email: "late@interiors.example", name: "", role: "EDITOR" });
    await prisma.invitation.updateMany({ where: { email: "late@interiors.example" }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await getInvitationPreview((result as { token: string }).token)).toBeNull();
  });

  it("adds existing users directly instead of inviting them", async () => {
    const other = await createBusiness(admin, { name: "Second Shop", slug: "second-shop", category: "other", description: "", email: "", phone: "", whatsappNumber: "", city: "", state: "" });
    const result = await inviteBusinessAdmin(admin, other.id, { email: "owner@interiors.example", name: "", role: "EDITOR" });
    expect(result.kind).toBe("added-existing-user");
    await expect(inviteBusinessAdmin(admin, other.id, { email: "owner@interiors.example", name: "", role: "EDITOR" })).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("user and business administration", () => {
  it("suspending a user ends their sessions", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "owner@interiors.example" } });
    await prisma.session.create({ data: { id: "s1", token: "t1", userId: user.id, expiresAt: new Date(Date.now() + 60_000) } });
    await setUserStatus(admin, user.id, "SUSPENDED");
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).status).toBe("SUSPENDED");
  });

  it("deleting a business requires the exact slug and keeps the audit trail", async () => {
    await expect(deleteBusiness(admin, businessId, "wrong")).rejects.toBeInstanceOf(ValidationError);
    await deleteBusiness(admin, businessId, "invite-test-interiors");
    expect(await prisma.business.findUnique({ where: { id: businessId } })).toBeNull();
    expect(await prisma.auditLog.count({ where: { businessId, action: "business.deleted" } })).toBe(1);
  });
});
