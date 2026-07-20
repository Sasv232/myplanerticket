"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Database, Train, Save } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <Header title="Настройки" description="Конфигурация приложения" />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Email уведомления (Gmail SMTP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--secondary)]">
              Для настройки Gmail SMTP: включите 2FA → создайте пароль приложения в{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                className="text-[var(--accent)] hover:underline"
              >
                myaccount.google.com/apppasswords
              </a>
            </p>
            <Input
              placeholder="Ваш Gmail"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Пароль приложения (16 символов)"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
            />
            <Input
              placeholder="Email для уведомлений"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
            />
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
            <p className="text-sm text-[var(--secondary)]">
              Turso (SQLite) — настраивается через переменные окружения в Vercel.
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              TURSO_DATABASE_URL и TURSO_AUTH_TOKEN задаются в .env.local
            </p>
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
            <p className="text-sm text-[var(--secondary)]">
              Модульная система парсеров. Добавить новый парсер можно в{" "}
              <code className="rounded bg-[var(--surface)] px-1 py-0.5 text-xs">
                src/lib/scrapers/
              </code>
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4" />
            {saved ? "Сохранено!" : "Сохранить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
