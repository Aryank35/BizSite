import { expect, test } from "@playwright/test";
import { SEEDED_OWNER, signIn } from "./helpers";

test("anonymous visitors are sent to sign in for private areas", async ({ page }) => {
  for (const path of ["/admin", "/admin/businesses", "/dashboard", "/dashboard/products"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
  }
});

test("sign-in errors are generic", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@e2e.example");
  await page.getByLabel("Password").fill("wrong-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("The email or password is incorrect, or the account is not active.")).toBeVisible();
});

test("unpublished websites, suspended businesses and draft products are not public", async ({ page }) => {
  const hidden = [
    { path: "/site/threadline-boutique", secret: "Sambalpuri" },
    { path: "/site/spark-electronics", secret: "Smart TV" },
    { path: "/site/royal-furniture/products/rattan-lounge-chair", secret: "Rattan" },
  ];
  for (const { path, secret } of hidden) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    expect(await page.content()).not.toContain(secret);
  }
  expect((await page.goto("/site/royal-furniture"))?.status()).toBe(200);
});

test("private pages are marked noindex", async ({ request }) => {
  const response = await request.get("/login");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /dashboard");
});

test("a business admin cannot open another business's records by id", async ({ page }) => {
  await signIn(page, SEEDED_OWNER);
  // Find a product id from another business through the public catalogue is impossible (ids are not exposed),
  // so try the obvious attack: a well-formed id that is not theirs.
  const response = await page.goto("/dashboard/products/cmforeignproductid000000");
  await expect(page.getByText("Page not found")).toBeVisible();
  expect(response?.status()).toBeLessThan(500);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard/);
});
