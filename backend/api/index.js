// Vercel serverless entrypoint — wraps the same Express app used by
// src/server.js locally. All routes are rewritten here via vercel.json.
//
// Runs pending migrations once per cold start before serving any request.
// Safe to do on every cold start: migrate() is idempotent (schema_migrations
// guard), and this is a demo deployment with no separate migration step in
// the deploy pipeline yet.
const app = require("../src/app");
const { migrate } = require("../src/db/migrate");

const ready = migrate().catch((err) => {
  console.error("Migration failed", err);
  throw err;
});

module.exports = async (req, res) => {
  await ready;
  return app(req, res);
};
