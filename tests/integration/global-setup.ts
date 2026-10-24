import { execSync } from "node:child_process";

/** Applies migrations to the test database before the integration suite runs. */
export default function setup() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
}
