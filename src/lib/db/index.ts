import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on("error", (err) => {
  console.error("Unexpected pool error:", err.message);
});

export const db = drizzle(pool, { schema });
