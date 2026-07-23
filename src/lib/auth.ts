import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, sessions } from "./db/schema";
import { eq, and, gt } from "drizzle-orm";
import { v4 as uuid } from "uuid";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET не задан! Добавьте JWT_SECRET в .env.local");
}
const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createJwtToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: `${SESSION_DAYS}d`,
  });
}

export function verifyJwtToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch {
    return null;
  }
}

export function generateSessionToken(): string {
  return uuid().replace(/-/g, "") + uuid().replace(/-/g, "");
}

export async function register(name: string, password: string, email?: string) {
  const existing = await db.select().from(users).where(eq(users.name, name)).limit(1);
  if (existing.length > 0) {
    return { error: "Имя пользователя уже занято" };
  }

  const id = "user_" + uuid().replace(/-/g, "").slice(0, 12);
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  await db.insert(users).values({
    id,
    name,
    email: email || null,
    passwordHash,
    createdAt: now,
  });

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(sessions).values({
    token,
    userId: id,
    expiresAt,
    createdAt: now,
  });

  return {
    token,
    user: { id, name, email: email || null, avatar: null, role: "user" },
  };
}

export async function login(name: string, password: string) {
  const rows = await db.select().from(users).where(eq(users.name, name)).limit(1);
  if (rows.length === 0) {
    return { error: "Неверное имя пользователя или пароль" };
  }

  const user = rows[0];
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Неверное имя пользователя или пароль" };
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(sessions).values({
    token,
    userId: user.id,
    expiresAt,
    createdAt: new Date().toISOString(),
  });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
  };
}

export async function getUserFromToken(token: string) {
  if (!token) return null;

  const sessionRows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date().toISOString())))
    .limit(1);

  if (sessionRows.length === 0) return null;

  const userRows = await db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, avatar: users.avatar, role: users.role })
    .from(users)
    .where(eq(users.id, sessionRows[0].userId))
    .limit(1);

  return userRows[0] || null;
}

export async function logout(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}
