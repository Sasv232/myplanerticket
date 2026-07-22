import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, any> = {};

  // Check env vars
  results.hasJwtSecret = !!process.env.JWT_SECRET;
  results.hasDatabaseUrl = !!process.env.DATABASE_URL;
  results.databaseUrlPrefix = process.env.DATABASE_URL?.substring(0, 30) + "...";

  // Test DB connection
  try {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const rows = await db.select({ id: users.id, name: users.name }).from(users).limit(3);
    results.dbOk = true;
    results.userCount = rows.length;
    results.userNames = rows.map((r) => r.name);
  } catch (e: any) {
    results.dbOk = false;
    results.dbError = e.message;
  }

  // Test JWT
  try {
    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign({ sub: "test" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET!);
    results.jwtOk = true;
  } catch (e: any) {
    results.jwtOk = false;
    results.jwtError = e.message;
  }

  // Test bcrypt
  try {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("test", 12);
    const match = await bcrypt.compare("test", hash);
    results.bcryptOk = match;
  } catch (e: any) {
    results.bcryptOk = false;
    results.bcryptError = e.message;
  }

  return NextResponse.json(results);
}
