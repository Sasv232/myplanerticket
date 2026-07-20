import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allNotifications = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
    return NextResponse.json(allNotifications);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
