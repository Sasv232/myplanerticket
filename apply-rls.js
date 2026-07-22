const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function apply() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, "supabase-rls.sql"), "utf8");
    
    // Разбиваем на отдельные запросы
    const queries = sql.split(";").map(q => q.trim()).filter(q => q.length > 0);
    
    let ok = 0, fail = 0;
    for (const query of queries) {
      try {
        await client.query(query);
        ok++;
      } catch (e) {
        // Игнорируем если policy уже существует
        if (e.code === "42710" || e.code === "42P07") {
          ok++;
        } else {
          console.log(`⚠️ ${e.code}: ${e.message.slice(0, 80)}`);
          fail++;
        }
      }
    }
    
    console.log(`✅ RLS применён: ${ok} успешно, ${fail} ошибок`);
  } finally {
    client.release();
    await pool.end();
  }
}

apply().catch(e => console.error("❌", e.message));
