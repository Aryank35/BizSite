import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { requiredText } from "@/lib/validators/common";

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, "Use at most 128 characters");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password").max(128),
});

export const acceptInvitationSchema = z
  .object({
    name: requiredText(100, "Your name"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export type AcceptInvitationInput = z.input<typeof acceptInvitationSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a new password" });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

export const accountNameSchema = z.object({ name: requiredText(100, "Name") });
