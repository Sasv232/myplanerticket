"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Database, Train, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface Settings {
  smtpConfigured: boolean;
  smtpUser: string;
  notificationEmail: string;
  databaseConnected: boolean;
  parsersAvailable: string[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div>
      <Header
        title="Настройки"
        description="Конфигурация приложения"
        actions={
          <Button variant="outline" size="sm" onClick={fetchSettings}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        }
      />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Email уведомления (Gmail SMTP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings?.smtpConfigured ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Настроено</span>
                <Badge variant="success">Активно</Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Не настроено</span>
                  <Badge variant="warning">Ожидает</Badge>
                </div>
                <div className="rounded-lg bg-[var(--surface)] p-3 text-xs text-[var(--secondary)] space-y-1">
                  <p>Для настройки Gmail SMTP задайте переменные окружения в Vercel:</p>
                  <code className="block rounded bg-[var(--bg)] p-2 mt-1">
                    SMTP_USER=your@gmail.com<br/>
                    SMTP_PASS=xxxx-xxxx-xxxx-xxxx<br/>
                    NOTIFICATION_EMAIL=your@gmail.com
                  </code>
                  <p className="mt-2">Инструкция: включите 2FA → создайте пароль приложения в{" "}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-[var(--accent)] hover:underline">
                      myaccount.google.com/apppasswords
                    </a>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              База данных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {settings?.databaseConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Supabase PostgreSQL — подключена</span>
                  <Badge variant="success">Онлайн</Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Не подключена</span>
                  <Badge variant="destructive">Ошибка</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Train className="h-4 w-4" />
              Парсеры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">РЖД</Badge>
                <span className="text-sm text-[var(--secondary)]">
                  Playwright (серверный) + API fallback + mock
                </span>
              </div>
              <p className="text-xs text-[var(--secondary)]">
                Модульная система парсеров. Добавить новый парсер можно в{" "}
                <code className="rounded bg-[var(--surface)] px-1 py-0.5 text-xs">
                  src/lib/scrapers/
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
