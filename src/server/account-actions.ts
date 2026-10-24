"use server";

import { APIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { accountNameSchema, changePasswordSchema, type ChangePasswordInput } from "@/lib/validators/auth";
import { runAction } from "@/server/action";
import { ValidationError } from "@/server/errors";
import { requireUser } from "@/server/session";

export async function updateAccountNameAction(input: { name: string }) {
  return runAction(async () => {
    const user = await requireUser();
    const { name } = accountNameSchema.parse(input);
    await prisma.user.update({ where: { id: user.id }, data: { name } });
    refresh();
    return null;
  });
}

export async function changePasswordAction(input: ChangePasswordInput) {
  return runAction(async () => {
    await requireUser();
    const values = changePasswordSchema.parse(input);
    try {
      await auth.api.changePassword({
        body: { currentPassword: values.currentPassword, newPassword: values.newPassword, revokeOtherSessions: true },
        headers: await headers(),
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw new ValidationError("Your current password is incorrect", { currentPassword: ["Incorrect password"] });
      }
      throw error;
    }
    return null;
  });
}
