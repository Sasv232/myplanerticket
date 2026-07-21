const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "migrate.sql"), "utf8");
  const pool = new Pool({
    connectionString: "postgresql://postgres.uqzqgrbkgbwnhapsciwb:sasvqwert4671@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await pool.query(sql);
  console.log("Migration done!");
  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
