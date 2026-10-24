"use server";

/**
 * Business dashboard actions. Each one resolves the tenant from the session
 * (requireTenant) and passes it to a service that scopes every query to that
 * business. Ids received from the client only ever identify records *within*
 * that business.
 */
import { refresh } from "next/cache";
import { z } from "zod";
import type { MoveDirection } from "@/lib/reorder";
import type { BusinessProfileInput } from "@/lib/validators/business";
import type { CategoryInput, ProductInput } from "@/lib/validators/catalogue";
import type { ThemeInput } from "@/lib/website/theme";
import { runAction } from "@/server/action";
import { requireTenant } from "@/server/session";
import { createCategory, deleteCategory, moveCategory, updateCategory } from "@/server/services/categories";
import { deleteEnquiry, updateEnquiryStatus } from "@/server/services/enquiries";
import {
  createProduct,
  deleteProduct,
  moveProduct,
  setProductFeatured,
  setProductStatus,
  updateProduct,
} from "@/server/services/products";
import { updateBusinessProfile } from "@/server/services/profile";
import {
  moveSection,
  publishWebsite,
  setSectionVisibility,
  unpublishWebsite,
  updateAppearance,
  updateSection,
} from "@/server/services/website";

const id = z.string().min(1).max(64);
const direction = z.enum(["up", "down"]);

// ─── Profile ────────────────────────────────────────────────────────────────

export async function updateProfileAction(input: BusinessProfileInput) {
  return runAction(async () => {
    await updateBusinessProfile(await requireTenant(), input);
    refresh();
    return null;
  });
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function createCategoryAction(input: CategoryInput) {
  return runAction(async () => {
    await createCategory(await requireTenant(), input);
    refresh();
    return null;
  });
}

export async function updateCategoryAction(categoryId: string, input: CategoryInput) {
  return runAction(async () => {
    await updateCategory(await requireTenant(), id.parse(categoryId), input);
    refresh();
    return null;
  });
}

export async function deleteCategoryAction(categoryId: string) {
  return runAction(async () => {
    await deleteCategory(await requireTenant(), id.parse(categoryId));
    refresh();
    return null;
  });
}

export async function moveCategoryAction(categoryId: string, dir: MoveDirection) {
  return runAction(async () => {
    await moveCategory(await requireTenant(), id.parse(categoryId), direction.parse(dir));
    refresh();
    return null;
  });
}

// ─── Products ───────────────────────────────────────────────────────────────

export async function createProductAction(input: ProductInput) {
  return runAction(async () => {
    const product = await createProduct(await requireTenant(), input);
    return { id: product.id };
  });
}

export async function updateProductAction(productId: string, input: ProductInput) {
  return runAction(async () => {
    await updateProduct(await requireTenant(), id.parse(productId), input);
    refresh();
    return null;
  });
}

export async function setProductStatusAction(productId: string, status: "DRAFT" | "PUBLISHED") {
  return runAction(async () => {
    await setProductStatus(await requireTenant(), id.parse(productId), z.enum(["DRAFT", "PUBLISHED"]).parse(status));
    refresh();
    return null;
  });
}

export async function setProductFeaturedAction(productId: string, featured: boolean) {
  return runAction(async () => {
    await setProductFeatured(await requireTenant(), id.parse(productId), z.boolean().parse(featured));
    refresh();
    return null;
  });
}

export async function deleteProductAction(productId: string) {
  return runAction(async () => {
    await deleteProduct(await requireTenant(), id.parse(productId));
    return null;
  });
}

export async function moveProductAction(productId: string, dir: MoveDirection, featuredOnly = false) {
  return runAction(async () => {
    await moveProduct(await requireTenant(), id.parse(productId), direction.parse(dir), z.boolean().parse(featuredOnly));
    refresh();
    return null;
  });
}

// ─── Website ────────────────────────────────────────────────────────────────

export async function updateAppearanceAction(input: ThemeInput) {
  return runAction(async () => {
    await updateAppearance(await requireTenant(), input);
    refresh();
    return null;
  });
}

export async function updateSectionAction(type: string, input: unknown) {
  return runAction(async () => {
    await updateSection(await requireTenant(), type, input);
    refresh();
    return null;
  });
}

export async function setSectionVisibilityAction(type: string, visible: boolean) {
  return runAction(async () => {
    await setSectionVisibility(await requireTenant(), type, z.boolean().parse(visible));
    refresh();
    return null;
  });
}

export async function moveSectionAction(type: string, dir: MoveDirection) {
  return runAction(async () => {
    await moveSection(await requireTenant(), type, direction.parse(dir));
    refresh();
    return null;
  });
}

export async function publishWebsiteAction() {
  return runAction(async () => {
    await publishWebsite(await requireTenant());
    refresh();
    return null;
  });
}

export async function unpublishWebsiteAction() {
  return runAction(async () => {
    await unpublishWebsite(await requireTenant());
    refresh();
    return null;
  });
}

// ─── Enquiries ──────────────────────────────────────────────────────────────

export async function updateEnquiryStatusAction(enquiryId: string, status: string) {
  return runAction(async () => {
    await updateEnquiryStatus(await requireTenant(), id.parse(enquiryId), status);
    refresh();
    return null;
  });
}

export async function deleteEnquiryAction(enquiryId: string) {
  return runAction(async () => {
    await deleteEnquiry(await requireTenant(), id.parse(enquiryId));
    refresh();
    return null;
  });
}
