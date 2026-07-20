import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackers, scrapeResults, priceHistory, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getScraper } from "@/lib/scrapers/registry";
import "@/lib/scrapers/init";
import { sendEmail, priceAlertEmail } from "@/lib/notifications/email";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeTrackers = await db
      .select()
      .from(trackers)
      .where(eq(trackers.isActive, true));

    const results = [];

    for (const tracker of activeTrackers) {
      const scraper = getScraper(tracker.type);
      if (!scraper) continue;

      const config = JSON.parse(tracker.config);
      const alerts = await scraper.checkPrice(tracker.id, config);

      await db
        .update(trackers)
        .set({ lastChecked: new Date().toISOString() })
        .where(eq(trackers.id, tracker.id));

      await db.insert(scrapeResults).values({
        id: uuid(),
        trackerId: tracker.id,
        data: JSON.stringify(alerts),
      });

      for (const alert of alerts) {
        const notifId = uuid();
        await db.insert(notifications).values({
          id: notifId,
          trackerId: tracker.id,
          type: "price_drop",
          title: "Найден билет",
          message: alert.message,
          sent: false,
          createdAt: new Date().toISOString(),
        });

        if (process.env.NOTIFICATION_EMAIL && process.env.SMTP_USER) {
          const sent = await sendEmail({
            to: process.env.NOTIFICATION_EMAIL,
            subject: `🚂 ${alert.message}`,
            html: priceAlertEmail(
              config.trainNumber || "N/A",
              `${config.from} → ${config.to}`,
              alert.newPrice || 0,
              "RUB"
            ),
          });

          if (sent) {
            await db
              .update(notifications)
              .set({ sent: true })
              .where(eq(notifications.id, notifId));
          }
        }
      }

      results.push({
        trackerId: tracker.id,
        alertsCount: alerts.length,
      });
    }

    return NextResponse.json({
      checked: activeTrackers.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
