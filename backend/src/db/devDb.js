// Zero-install local Postgres for development, matching
// xtreme-finance-system's `npm run dev:db` — no external Postgres install
// needed on a dev machine. Production points DATABASE_URL at a real Postgres.
const EmbeddedPostgres = require("embedded-postgres").default;

const pg = new EmbeddedPostgres({
  databaseDir: __dirname + "/../../.pgdata",
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
});

async function start() {
  // Data directory persists across runs — only initialise it once.
  await pg.initialise().catch((err) => {
    if (!/exists but is not empty/.test(err.message)) throw err;
  });
  await pg.start();
  await pg.createDatabase("xtreme_books").catch(() => {});
  console.log("Embedded Postgres running on :5432 (database: xtreme_books)");
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
