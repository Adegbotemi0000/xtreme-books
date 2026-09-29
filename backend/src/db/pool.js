const { Pool } = require("pg");

// Single shared pool, mirroring xtreme-finance-system's convention — every
// module queries through this, never opens its own connection.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = { pool };
