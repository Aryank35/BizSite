import { cookies } from "next/headers";
import { AppError } from "@/server/errors";
import { ACTIVE_BUSINESS_COOKIE, getSessionUser } from "@/server/session";
import { storeImage } from "@/server/services/media";
import { can, resolveTenantContext } from "@/server/tenant";
import { hitThrottle } from "@/server/throttle";

/**
 * Image upload for the business currently being managed. The owning business
 * is derived from the session and membership, never from the request body.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Please sign in again" }, { status: 401 });

  const ctx = await resolveTenantContext(user, (await cookies()).get(ACTIVE_BUSINESS_COOKIE)?.value);
  if (!ctx || !can(ctx, "content:manage")) {
    return Response.json({ error: "You cannot upload images for this business" }, { status: 403 });
  }

  if (!(await hitThrottle(`upload:user:${user.id}`, 60, 10 * 60))) {
    return Response.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received" }, { status: 400 });
  const alt = form?.get("alt");

  try {
    const image = await storeImage({
      businessId: ctx.businessId,
      uploadedById: user.id,
      file,
      altText: typeof alt === "string" ? alt : null,
    });
    return Response.json({ url: image.url, id: image.id }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return Response.json({ error: error.message }, { status: 400 });
    console.error("[upload] failed", error);
    return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
