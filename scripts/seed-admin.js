const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  try {
    await pool.query("UPDATE users SET role = 'admin' WHERE name = 'Администратор'");
    console.log('Администратор now admin');
    const users = await pool.query('SELECT id, name, role FROM users');
    console.log('users:', JSON.stringify(users.rows));
  } catch(e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
main();
