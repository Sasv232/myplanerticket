const { Client } = require("pg");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await c.connect();
  const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  r.rows.forEach(row => console.log(row.table_name));
  await c.end();
}

run();
