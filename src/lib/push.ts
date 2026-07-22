import webPush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions, notificationPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:kovalev.kirill.nikitich@gmail.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (prefs.length > 0) {
      const p = prefs[0];
      if (payload.tag === "messenger" && !p.messenger) return;
      if (payload.tag === "deadline" && !p.deadlines) return;
      if (payload.tag === "habit" && !p.habits) return;
      if (payload.tag === "server_error" && !p.serverErrors) return;
      if (payload.tag === "maintenance" && !p.maintenance) return;
    }

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      url: payload.url || "/",
      tag: payload.tag || "default",
    });

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            notificationPayload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          }
          throw err;
        }
      })
    );

    return results;
  } catch (err) {
    console.error("Push send error:", err);
  }
}

export async function sendPushToAll(payload: PushPayload) {
  try {
    const subs = await db.select().from(pushSubscriptions);
    if (subs.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      url: payload.url || "/",
      tag: payload.tag || "default",
    });

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            notificationPayload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          }
          throw err;
        }
      })
    );

    return results;
  } catch (err) {
    console.error("Push broadcast error:", err);
  }
}
