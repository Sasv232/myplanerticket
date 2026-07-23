"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle, AlertTriangle, Clock, BellOff } from "lucide-react";

interface Notification { id: string; trackerId: string | null; type: string; title: string; message: string; sent: boolean; createdAt: string; }

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  price_drop: { icon: AlertTriangle, color: "var(--warning)" },
  ticket_available: { icon: Bell, color: "var(--primary)" },
  reminder: { icon: Clock, color: "var(--text-muted)" },
  task_due: { icon: CheckCircle, color: "var(--mint)" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="heading-xl" style={{ marginBottom: 4 }}>Уведомления</h1>
        <p className="text-body">Всего: {notifications.length} · Не отправлено: {notifications.filter(n => !n.sent).length}</p>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state" style={{ padding: 64 }}>
          <div className="empty-state-icon"><BellOff className="h-8 w-8" /></div>
          <p className="empty-state-title">Уведомлений пока нет</p>
          <p className="empty-state-desc">Здесь появятся важные события и напоминания</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map(notif => {
            const config = typeConfig[notif.type] || typeConfig.ticket_available;
            const Icon = config.icon;
            return (
              <div key={notif.id} className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div className="stat-icon" style={{ background: `${config.color}15`, color: config.color, width: 40, height: 40, flexShrink: 0 }}>
                  <Icon className="h-4 w-4" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="heading-sm">{notif.title}</p>
                  <p className="text-caption" style={{ marginTop: 2 }}>{notif.message}</p>
                  <p className="text-xs" style={{ marginTop: 4 }}>{new Date(notif.createdAt).toLocaleString("ru-RU")}</p>
                </div>
                {!notif.sent && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0, marginTop: 6 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
