// const { Pool } = require('pg');
// require('dotenv').config();

// // Create a connection pool configured for high concurrency
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   max: 50, // max 50 clients in the pool for higher concurrency
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 2000,
// });

// pool.on('error', (err, client) => {
//   console.error('Unexpected error on idle client', err);
//   process.exit(-1);
// });

// module.exports = {
//   query: (text, params) => pool.query(text, params),
//   getClient: () => pool.connect(),
// };

const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                // max concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
  keepAlive: true
});

/* ---------- error safety ---------- */
pool.on("error", (err) => {
  console.error("PG POOL ERROR:", err.message);
});

/* ---------- safe query wrapper ---------- */
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};