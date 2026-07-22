import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`,
  `CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)`,
  `CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id)`,
  `CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date)`,
  `CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_karma_user_id ON karma(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id)`,
  `CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id)`,
  `CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id)`,
  `CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_food_entries_user_id ON food_entries(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_food_entries_date ON food_entries(date)`,
  `CREATE INDEX IF NOT EXISTS idx_water_entries_user_id ON water_entries(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_weight_entries_user_id ON weight_entries(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_health_profile_user_id ON health_profile(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON mood_entries(date)`,
  `CREATE INDEX IF NOT EXISTS idx_user_mentions_mentioned_user_id ON user_mentions(mentioned_user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON conversation_members(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id ON conversation_members(conversation_id)`,
];

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    let created = 0;
    let errors = 0;
    for (const idx of INDEXES) {
      try {
        await db.execute(sql.raw(idx));
        created++;
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ ok: true, created, errors });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
