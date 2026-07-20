"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
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
    <div>
      <Header
        title="Уведомления"
        description={`Всего: ${notifications.length} · Не отправлено: ${notifications.filter((n) => !n.sent).length}`}
      />
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card>
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
              <Card key={notif.id}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="mt-0.5">
                    <Icon className="h-5 w-5 text-[var(--secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium">{notif.title}</h3>
                      <Badge variant={config.variant}>
                        {notif.type === "price_drop" ? "Цена" : notif.type}
                      </Badge>
                      {notif.sent && (
                        <Badge variant="success">Отправлено</Badge>
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
