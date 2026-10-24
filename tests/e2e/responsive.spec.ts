import { expect, test } from "@playwright/test";

test("public website works on small screens", async ({ page }) => {
  await page.goto("/site/royal-furniture");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  const viewport = page.viewportSize()!.width;
  expect(width).toBeLessThanOrEqual(viewport + 1); // no horizontal scrolling

  if (viewport < 768) {
    await page.getByLabel("Open menu").click();
    await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/site\/royal-furniture\/products/);
  }
});

test("marketing pages render without horizontal scrolling", async ({ page }) => {
  for (const path of ["/", "/features", "/pricing", "/contact"]) {
    await page.goto(path);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, path).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  }
});
