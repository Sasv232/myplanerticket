import { pgTable, text, integer, boolean, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
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

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").default("📁"),
  color: text("color").default("#3b82f6"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
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
  repeatRule: text("repeat_rule"),
  repeatAfterComplete: boolean("repeat_after_complete").default(false),
  label: text("label"),
  emoji: text("emoji"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const subtasks = pgTable("subtasks", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const habits = pgTable("habits", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").default("✅"),
  color: text("color").default("#22c55e"),
  frequency: text("frequency", { enum: ["daily", "weekly", "monthly"] }).notNull().default("daily"),
  targetCount: integer("target_count").notNull().default(1),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const habitLogs = pgTable("habit_logs", {
  id: text("id").primaryKey(),
  habitId: text("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  count: integer("count").notNull().default(1),
  note: text("note"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const goals = pgTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetCount: integer("target_count").notNull().default(10),
  currentCount: integer("current_count").notNull().default(0),
  emoji: text("emoji").default("🎯"),
  resetPeriod: text("reset_period", { enum: ["daily", "weekly", "monthly", "none"] }).notNull().default("weekly"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const karma = pgTable("karma", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  streak: integer("streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const attachments = pgTable("attachments", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  fileData: text("file_data").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const timeEntries = pgTable("time_entries", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  duration: integer("duration").notNull(),
  note: text("note"),
  startedAt: text("started_at").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  trackerId: text("tracker_id"),
  type: text("type", {
    enum: ["price_drop", "ticket_available", "reminder", "task_due"],
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  sent: boolean("sent").notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const templates = pgTable("templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tasks: text("tasks").notNull().default("[]"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  color: text("color").default("#e0e7ff"),
  pinned: boolean("pinned").default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const journalEntries = pgTable("journal_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  mood: text("mood"),
  pinned: boolean("pinned").default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const foodEntries = pgTable("food_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").default(0),
  carbs: real("carbs").default(0),
  fat: real("fat").default(0),
  mealType: text("meal_type").notNull(),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const waterEntries = pgTable("water_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const weightEntries = pgTable("weight_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  weight: real("weight").notNull(),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const healthProfile = pgTable("health_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  height: real("height"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  activityLevel: text("activity_level").default("sedentary"),
  dailyCalorieGoal: real("daily_calorie_goal"),
  dailyWaterGoal: real("daily_water_goal"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const projectMembers = pgTable("project_members", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const projectInvites = pgTable("project_invites", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  role: text("role").notNull().default("member"),
  maxUses: integer("max_uses"),
  uses: integer("uses").default(0),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const projectActivity = pgTable("project_activity", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
