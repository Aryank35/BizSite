import "dotenv/config";
import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Integration tests run the real services against TEST_DATABASE_URL, which is
 * migrated and wiped by tests/integration/global-setup.ts.
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error("Set TEST_DATABASE_URL to run integration tests.");
if (testDatabaseUrl === process.env.DATABASE_URL) throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL — it is wiped by the tests.");

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/integration/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testDatabaseUrl,
      STORAGE_DRIVER: "local",
      LOCAL_UPLOAD_DIR: ".data/test-uploads",
    },
  },
});
