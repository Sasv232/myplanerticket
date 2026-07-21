const { Client } = require("pg");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await c.connect();
  const r = await c.query("SELECT pid, state, query FROM pg_stat_activity WHERE datname = current_database() AND state != 'idle'");
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
}

run();
