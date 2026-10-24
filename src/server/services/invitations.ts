import "server-only";
import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/db";
import { acceptInvitationSchema } from "@/lib/validators/auth";
import { recordAudit } from "@/server/audit";
import { ConflictError, NotFoundError } from "@/server/errors";
import { hashToken } from "@/server/services/businesses";

async function findOpenInvitation(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { business: { select: { name: true } } },
  });
  if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt < new Date()) return null;
  return invitation;
}

/** Public view of an invitation: only what the accept page needs. */
export async function getInvitationPreview(token: string) {
  const invitation = await findOpenInvitation(token);
  if (!invitation) return null;
  return { email: invitation.email, name: invitation.name, businessName: invitation.business.name };
}

export async function acceptInvitation(token: string, input: unknown) {
  const data = acceptInvitationSchema.parse(input);
  const invitation = await findOpenInvitation(token);
  if (!invitation) throw new NotFoundError("Invitation");

  if (await prisma.user.findUnique({ where: { email: invitation.email }, select: { id: true } })) {
    throw new ConflictError("An account with this email already exists. Ask your platform administrator to add it to the business.");
  }

  const passwordHash = await hashPassword(data.password);
  const userId = await prisma.$transaction(async (tx) => {
    // Marking the invitation first makes concurrent acceptances fail cleanly.
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, revokedAt: null },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count === 0) throw new NotFoundError("Invitation");

    const user = await tx.user.create({
      data: { name: data.name, email: invitation.email, emailVerified: true, role: "BUSINESS_ADMIN" },
    });
    await tx.account.create({
      data: {
        id: randomBytes(16).toString("hex"),
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
    await tx.businessMembership.create({
      data: { userId: user.id, businessId: invitation.businessId, role: invitation.role },
    });
    await recordAudit(
      { actorId: user.id, action: "business.invitation_accepted", entityType: "Invitation", entityId: invitation.id, businessId: invitation.businessId },
      tx,
    );
    return user.id;
  });
  return { userId, email: invitation.email };
}
