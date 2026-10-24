/**
 * Development-only PostgreSQL server.
 *
 * Runs real PostgreSQL binaries (via the `embedded-postgres` package) with data
 * stored in ./.data/postgres, so the project can be developed without installing
 * PostgreSQL or Docker. Keep this terminal open while developing.
 *
 * Not used in production — point DATABASE_URL at any PostgreSQL 14+ server instead.
 */
import EmbeddedPostgres from "embedded-postgres";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const dataDir = path.resolve(".data/postgres");
const port = Number(process.env.EMBEDDED_PG_PORT ?? 5544);
const databases = ["bizsite", "bizsite_test"];

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
  // Force UTF-8 regardless of the OS locale (Windows defaults to WIN1252).
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => {},
});

// A previous run that was killed (rather than stopped with Ctrl+C) can leave
// the server running; stop it so this run starts cleanly.
if (existsSync(path.join(dataDir, "postmaster.pid"))) {
  const platform = process.platform === "win32" ? "windows" : process.platform;
  const binaries = (await import(`@embedded-postgres/${platform}-${process.arch}`)) as { pg_ctl: string };
  spawnSync(binaries.pg_ctl, ["stop", "-D", dataDir, "-m", "fast"], { stdio: "ignore" });
}

if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
  console.log(`Initialising PostgreSQL cluster in ${dataDir}…`);
  await pg.initialise();
}

await pg.start();

const client = pg.getPgClient();
await client.connect();
for (const name of databases) {
  const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
  if (existing.rowCount === 0) {
    await client.query(`CREATE DATABASE "${name}"`);
    console.log(`Created database ${name}`);
  }
}
await client.end();

console.log(`PostgreSQL is running on port ${port} (databases: ${databases.join(", ")}). Press Ctrl+C to stop.`);

async function shutdown() {
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Keep the process alive; the cluster stops when this script exits.
setInterval(() => {}, 1 << 30);
