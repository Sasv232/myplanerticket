import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "in_progress", "done"] })
    .notNull()
    .default("todo"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] })
    .notNull()
    .default("medium"),
  dueDate: text("due_date"),
  tags: text("tags").default("[]"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const trackers = pgTable("trackers", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  config: text("config").notNull().default("{}"),
  isActive: boolean("is_active").notNull().default(true),
  checkInterval: integer("check_interval").notNull().default(3600),
  lastChecked: text("last_checked"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const scrapeResults = pgTable("scrape_results", {
  id: text("id").primaryKey(),
  trackerId: text("tracker_id")
    .notNull()
    .references(() => trackers.id, { onDelete: "cascade" }),
  data: text("data").notNull(),
  scrapedAt: text("scraped_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const priceHistory = pgTable("price_history", {
  id: text("id").primaryKey(),
  trackerId: text("tracker_id")
    .notNull()
    .references(() => trackers.id, { onDelete: "cascade" }),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("RUB"),
  routeInfo: text("route_info").default("{}"),
  recordedAt: text("recorded_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  trackerId: text("tracker_id").references(() => trackers.id, {
    onDelete: "set null",
  }),
  type: text("type", {
    enum: ["price_drop", "ticket_available", "reminder", "task_due"],
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  sent: boolean("sent").notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
