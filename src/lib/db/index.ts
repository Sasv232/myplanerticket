import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/myplanerticket";

const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

let initialized = false;

export async function ensureDb() {
  if (initialized) return;
  initialized = true;

  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      due_date TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trackers (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      config TEXT NOT NULL DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      check_interval INTEGER NOT NULL DEFAULT 3600,
      last_checked TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scrape_results (
      id TEXT PRIMARY KEY,
      tracker_id TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
      data TEXT NOT NULL,
      scraped_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id TEXT PRIMARY KEY,
      tracker_id TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
      price INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RUB',
      route_info TEXT DEFAULT '{}',
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      tracker_id TEXT REFERENCES trackers(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      sent BOOLEAN NOT NULL DEFAULT false,
      created_at TEXT NOT NULL
    );
  `);
}
