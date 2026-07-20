"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface Notification {
  id: string;
  trackerId: string | null;
  type: string;
  title: string;
  message: string;
  sent: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { icon: typeof Bell; variant: "default" | "destructive" | "warning" | "success" | "secondary" }> = {
  price_drop: { icon: AlertTriangle, variant: "warning" },
  ticket_available: { icon: Bell, variant: "default" },
  reminder: { icon: Clock, variant: "secondary" },
  task_due: { icon: CheckCircle, variant: "success" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="space-y-4">
      <div className="mobile-page-header">
        <h1 className="text-2xl font-bold tracking-tight">Уведомления</h1>
        <p className="text-sm text-[var(--secondary)]">
          Всего: {notifications.length} · Не отправлено: {notifications.filter((n) => !n.sent).length}
        </p>
      </div>
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="mobile-widget-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
              <Bell className="mb-3 h-10 w-10 opacity-50" />
              <p>Уведомлений пока нет</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.ticket_available;
            const Icon = config.icon;
            return (
              <Card key={notif.id} className="mobile-task-card">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] shrink-0">
                    <Icon className="h-5 w-5 text-[var(--secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-medium">{notif.title}</h3>
                      <Badge variant={config.variant} className="text-[10px]">
                        {notif.type === "price_drop" ? "Цена" : notif.type}
                      </Badge>
                      {notif.sent && (
                        <Badge variant="success" className="text-[10px]">Отправлено</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--secondary)]">{notif.message}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {new Date(notif.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
