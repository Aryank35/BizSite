/**
 * The core workflow: a super admin onboards a business, its administrator
 * builds the catalogue and website, publishes, and receives an enquiry.
 */
import { expect, test } from "@playwright/test";
import { SUPERADMIN, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

const runId = Date.now().toString(36);
const businessName = `E2E Teak House ${runId}`;
const slug = `e2e-teak-house-${runId}`;
const ownerEmail = `owner-${runId}@e2e.example`;
const ownerPassword = "e2e-Strong-Password-1";
const productName = `Carved Teak Bench ${runId}`;
const heroDraft1 = `Handmade teak furniture ${runId}`;
const heroDraft2 = `Second headline ${runId}`;

let inviteUrl = "";

test("super admin creates a business and assigns an administrator", async ({ page }) => {
  await signIn(page, SUPERADMIN);
  await page.goto("/admin/businesses/new");
  await page.getByLabel("Business name").fill(businessName);
  await page.getByLabel("Web address").fill(slug);
  await page.getByLabel("Category").selectOption("furniture");
  await page.getByLabel("WhatsApp number").fill("+91 94370 55555");
  await page.getByRole("button", { name: "Create business" }).click();

  await expect(page).toHaveURL(/\/admin\/businesses\/c[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: businessName })).toBeVisible();

  await page.getByRole("button", { name: "Assign administrator" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email").fill(ownerEmail);
  await dialog.getByLabel("Name").fill("E2E Owner");
  await dialog.getByRole("button", { name: "Continue" }).click();
  inviteUrl = await dialog.getByLabel("Invitation link").inputValue();
  expect(inviteUrl).toContain("/invite/");

  // The business is listed and searchable.
  await page.goto(`/admin/businesses?q=${encodeURIComponent(runId)}`);
  await expect(page.getByRole("link", { name: businessName })).toBeVisible();
});

test("the new administrator accepts the invitation and sees only their business", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(inviteUrl);
  await expect(page.getByRole("heading", { name: `Join ${businessName}` })).toBeVisible();
  await page.getByLabel("Your name").fill("E2E Owner");
  await page.getByLabel("Password", { exact: true }).fill(ownerPassword);
  await page.getByLabel("Confirm password").fill(ownerPassword);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(`Here is what is happening with ${businessName}.`)).toBeVisible();

  // Business admins cannot open the platform admin area.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Platform overview")).toHaveCount(0);

  // The invitation link cannot be used again.
  await page.goto(inviteUrl);
  await expect(page.getByText("This invitation is no longer valid")).toBeVisible();
  await context.storageState({ path: ".data/e2e-owner-state.json" });
  await context.close();
});

test.describe("as the business administrator", () => {
  test.use({ storageState: ".data/e2e-owner-state.json" });

  test("creates a category and a published product that persists after refresh", async ({ page }) => {
    await page.goto("/dashboard/categories");
    await page.getByRole("button", { name: "New category" }).click();
    await page.getByRole("dialog").getByLabel("Name").fill("Benches");
    await page.getByRole("dialog").getByRole("button", { name: "Create category" }).click();
    await expect(page.getByText("Category created")).toBeVisible();

    await page.goto("/dashboard/products/new");
    await page.getByLabel("Product name").fill(productName);
    await page.getByLabel("Short description").fill("Solid teak bench with hand-carved panels.");
    await page.getByLabel("Status").selectOption("PUBLISHED");
    await page.getByLabel("Category").selectOption({ label: "Benches" });
    await page.getByLabel("Price (INR)").fill("18500");
    await page.getByRole("button", { name: "Create product" }).click();
    await expect(page).toHaveURL(/\/dashboard\/products\/c[a-z0-9]+$/);

    await page.reload();
    await expect(page.getByLabel("Product name")).toHaveValue(productName);
    await expect(page.getByLabel("Price (INR)")).toHaveValue("18500");

    // Unpublish and publish again from the list.
    await page.goto("/dashboard/products");
    await page.getByRole("button", { name: `Actions for ${productName}` }).click();
    await page.getByRole("menuitem", { name: "Unpublish" }).click();
    await expect(page.getByText("Product unpublished")).toBeVisible();
    await page.getByRole("button", { name: `Actions for ${productName}` }).click();
    await page.getByRole("menuitem", { name: "Publish" }).click();
    await expect(page.getByText("Product published")).toBeVisible();
  });

  test("customises the website, keeps drafts private and publishes", async ({ page, browser }) => {
    await page.goto("/dashboard/website/appearance");
    await page.getByRole("radio", { name: /Professional Business/ }).click();
    await page.getByLabel("Primary", { exact: true }).fill("#0f766e");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Draft saved")).toBeVisible();

    await page.goto("/dashboard/website/sections");
    await page.getByRole("button", { name: "Edit Hero banner" }).click();
    await page.getByRole("dialog").getByLabel("Heading", { exact: true }).fill(heroDraft1);
    await page.getByRole("dialog").getByRole("button", { name: "Save to draft" }).click();
    await expect(page.getByText("Hero banner saved to draft")).toBeVisible();

    // Not published yet: anonymous visitors see the not-found page.
    const anonymous = await browser.newContext();
    const visitor = await anonymous.newPage();
    await visitor.goto(`/site/${slug}`);
    await expect(visitor.getByRole("heading", { name: "Page not found" })).toBeVisible();
    expect(await visitor.content()).not.toContain(heroDraft1);

    // The draft preview shows the change.
    await page.goto("/dashboard/website");
    const previewHref = await page.getByRole("link", { name: "Preview draft" }).getAttribute("href");
    await page.goto(previewHref!);
    await expect(page.getByRole("heading", { level: 1, name: heroDraft1 })).toBeVisible();

    await page.goto("/dashboard/website");
    await page.getByRole("button", { name: "Publish website" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Website published")).toBeVisible();

    const live = await visitor.goto(`/site/${slug}`);
    expect(live?.status()).toBe(200);
    await expect(visitor.getByRole("heading", { level: 1, name: heroDraft1 })).toBeVisible();
    await expect(visitor.getByText(productName).first()).toBeVisible();
    await visitor.goto(`/site/${slug}/products`);
    await expect(visitor.getByRole("link", { name: new RegExp(productName) })).toBeVisible();
    await visitor.goto(`/site/${slug}`);
    const style = await visitor.locator("[style*='--site-primary']").first().getAttribute("style");
    expect(style).toContain("#0f766e");

    // A new draft edit does not reach the live site until it is published.
    await page.goto("/dashboard/website/sections");
    await page.getByRole("button", { name: "Edit Hero banner" }).click();
    await page.getByRole("dialog").getByLabel("Heading", { exact: true }).fill(heroDraft2);
    await page.getByRole("dialog").getByRole("button", { name: "Save to draft" }).click();
    await expect(page.getByText("Hero banner saved to draft")).toBeVisible();
    await visitor.reload();
    await expect(visitor.getByRole("heading", { level: 1, name: heroDraft1 })).toBeVisible();

    await page.goto("/dashboard/website");
    await expect(page.getByText("Unpublished changes")).toBeVisible();
    await page.getByRole("button", { name: "Publish changes" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Website published")).toBeVisible();
    await visitor.reload();
    await expect(visitor.getByRole("heading", { level: 1, name: heroDraft2 })).toBeVisible();
    await anonymous.close();
  });

  test("a visitor's product enquiry reaches this business's inbox", async ({ page, browser }) => {
    const anonymous = await browser.newContext();
    const visitor = await anonymous.newPage();
    await visitor.goto(`/site/${slug}/products`);
    await visitor.getByRole("link", { name: new RegExp(productName) }).first().click();
    await expect(visitor.getByRole("heading", { level: 1, name: productName })).toBeVisible();
    await expect(visitor.getByText("₹18,500").first()).toBeVisible();
    const whatsapp = visitor.getByRole("link", { name: "Ask on WhatsApp" });
    await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/919437055555\?text=/);

    const form = visitor.locator("#product-enquiry form");
    await form.getByLabel("Your name").fill(`Visitor ${runId}`);
    await form.getByLabel("Phone").fill("+91 98765 43210");
    await form.getByLabel("Message").fill("Can this bench be made 6 feet long?");
    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(visitor.getByText("Thank you! We have received your enquiry")).toBeVisible();
    await anonymous.close();

    await page.goto("/dashboard/enquiries");
    await page.getByRole("link", { name: new RegExp(`Visitor ${runId}`) }).click();
    await expect(page.getByText("Can this bench be made 6 feet long?").last()).toBeVisible();
    await expect(page.getByRole("link", { name: productName })).toBeVisible();
    await page.getByLabel("Status", { exact: true }).selectOption("IN_PROGRESS");
    await expect(page.getByText("Status updated")).toBeVisible();
  });
});
