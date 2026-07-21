import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { habitLogs } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString().split("T")[0];

    const logs = await db
      .select()
      .from(habitLogs)
      .where(
        and(eq(habitLogs.habitId, id), gte(habitLogs.date, since))
      );

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
