import "server-only";
import { prisma } from "@/lib/db";
import { websiteRequestSchema } from "@/lib/validators/enquiry";
import { NotFoundError } from "@/server/errors";
import { enforceThrottle } from "@/server/throttle";

export async function submitWebsiteRequest(input: unknown, clientKey: string): Promise<void> {
  const data = websiteRequestSchema.parse(input);
  if (data.hpField.trim() !== "") return;
  await enforceThrottle(`website-request:ip:${clientKey}`, 3, 30 * 60);
  await prisma.websiteRequest.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      businessName: data.businessName,
      category: data.category,
      message: data.message,
    },
  });
}

export async function listWebsiteRequests(take = 50) {
  return prisma.websiteRequest.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take });
}

export async function setWebsiteRequestHandled(id: string, handled: boolean) {
  const result = await prisma.websiteRequest.updateMany({ where: { id }, data: { handled } });
  if (result.count === 0) throw new NotFoundError("Request");
}
