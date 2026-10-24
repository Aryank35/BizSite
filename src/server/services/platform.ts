import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { optionalEmail, requiredText } from "@/lib/validators/common";
import { SECTION_TYPES } from "@/lib/website/sections";
import { TEMPLATE_KEYS } from "@/lib/website/theme";
import { recordAudit } from "@/server/audit";
import { ValidationError } from "@/server/errors";
import type { SessionUser } from "@/server/tenant";

export const platformSettingsSchema = z.object({
  platformName: requiredText(60, "Platform name"),
  supportEmail: optionalEmail,
  defaultTemplate: z.enum(TEMPLATE_KEYS),
});

export const templateAvailabilitySchema = z.object({
  enabledTemplates: z.array(z.enum(TEMPLATE_KEYS)).min(1, "Keep at least one template enabled"),
  enabledSectionTypes: z.array(z.enum(SECTION_TYPES)),
});

export async function getPlatformSettings() {
  return prisma.platformSetting.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform", enabledTemplates: [...TEMPLATE_KEYS], enabledSectionTypes: [...SECTION_TYPES] },
  });
}

export async function updatePlatformSettings(actor: SessionUser, input: unknown) {
  const data = platformSettingsSchema.parse(input);
  const current = await getPlatformSettings();
  if (!current.enabledTemplates.includes(data.defaultTemplate)) {
    throw new ValidationError("The default template must be enabled", { defaultTemplate: ["Enable this template first"] });
  }
  await prisma.platformSetting.update({ where: { id: "platform" }, data });
  await recordAudit({ actorId: actor.id, action: "platform.settings_updated", entityType: "PlatformSetting", metadata: data });
}

export async function updateTemplateAvailability(actor: SessionUser, input: unknown) {
  const data = templateAvailabilitySchema.parse(input);
  const current = await getPlatformSettings();
  // Header and footer are structural; they cannot be disabled platform-wide.
  const sections = [...new Set([...data.enabledSectionTypes, "HEADER", "FOOTER"] as const)];
  const defaultTemplate = data.enabledTemplates.includes(current.defaultTemplate)
    ? current.defaultTemplate
    : data.enabledTemplates[0];
  await prisma.platformSetting.update({
    where: { id: "platform" },
    data: { enabledTemplates: data.enabledTemplates, enabledSectionTypes: sections, defaultTemplate },
  });
  await recordAudit({
    actorId: actor.id,
    action: "platform.templates_updated",
    entityType: "PlatformSetting",
    metadata: { enabledTemplates: data.enabledTemplates, enabledSectionTypes: sections },
  });
}
