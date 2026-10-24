import "dotenv/config";
import { expect, type Page } from "@playwright/test";

export const SUPERADMIN = {
  email: process.env.SEED_SUPERADMIN_EMAIL ?? "admin@bizsite.local",
  password: process.env.SEED_SUPERADMIN_PASSWORD ?? "",
};

export const SEEDED_OWNER = {
  email: "owner@royal-furniture.example",
  password: process.env.SEED_BUSINESS_ADMIN_PASSWORD ?? "",
};

export async function signIn(page: Page, credentials: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(admin|dashboard)/);
}
