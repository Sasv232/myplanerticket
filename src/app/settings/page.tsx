"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, RefreshCw, CheckCircle, AlertCircle, Mail, Database, Download, Upload } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";

const PRIMARY_COLORS = [
  { name: "Синий", value: "#3b82f6", class: "blue" },
  { name: "Индиго", value: "#6366f1", class: "indigo" },
  { name: "Фиолетовый", value: "#8b5cf6", class: "violet" },
  { name: "Розовый", value: "#ec4899", class: "pink" },
  { name: "Красный", value: "#ef4444", class: "red" },
  { name: "Оранжевый", value: "#f97316", class: "orange" },
  { name: "Янтарный", value: "#f59e0b", class: "amber" },
  { name: "Зелёный", value: "#22c55e", class: "green" },
  { name: "Изумрудный", value: "#10b981", class: "emerald" },
  { name: "Бирюзовый", value: "#06b6d4", class: "cyan" },
];

const SECONDARY_COLORS = [
  { name: "Серый", value: "#6b7280", class: "gray" },
  { name: "Серый-600", value: "#4b5563", class: "gray600" },
  { name: "Серый-700", value: "#374151", class: "gray700" },
  { name: "Серый-800", value: "#1f2937", class: "gray800" },
  { name: "Серый-900", value: "#111827", class: "gray900" },
  { name: "Коричневый", value: "#78716c", class: "stone" },
  { name: "Цинковый", value: "#71717a", class: "zinc" },
  { name: "Нейтральный", value: "#737373", class: "neutral" },
  { name: "Сланцевый", value: "#64748b", class: "slate" },
  { name: "Тёмно-синий", value: "#475569", class: "darkSlate" },
];

interface Settings {
  smtpConfigured: boolean;
  databaseConnected: boolean;
}

export default function SettingsPage() {
  const { theme } = useTheme();
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#6b7280");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) setSettings(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
    const savedPrimary = localStorage.getItem("primaryColor") || "#3b82f6";
    const savedSecondary = localStorage.getItem("secondaryColor") || "#6b7280";
    setPrimaryColor(savedPrimary);
    setSecondaryColor(savedSecondary);
    applyColors(savedPrimary, savedSecondary);
  }, [fetchSettings]);

  const applyColors = (primary: string, secondary: string) => {
    document.documentElement.style.setProperty("--accent", primary);
    document.documentElement.style.setProperty("--secondary", secondary);
  };

  const handlePrimaryChange = (color: string) => {
    setPrimaryColor(color);
    localStorage.setItem("primaryColor", color);
    applyColors(color, secondaryColor);
  };

  const handleSecondaryChange = (color: string) => {
    setSecondaryColor(color);
    localStorage.setItem("secondaryColor", color);
    applyColors(primaryColor, color);
  };

  const handleExport = async () => {
    const res = await fetch("/api/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `myplanericket-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.ok) {
      alert(`Импортировано задач: ${result.imported}`);
      window.location.reload();
    }
  };

  return (
    <>
      {/* ===== DESKTOP ===== */}
      <div className="hidden md:block">
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
                <Palette className="h-4 w-4" />
                Цвета темы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Основной цвет</p>
                <div className="grid grid-cols-5 gap-2">
                  {PRIMARY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handlePrimaryChange(c.value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all ${
                        primaryColor === c.value
                          ? "border-[var(--foreground)] scale-105"
                          : "border-transparent hover:border-[var(--border)]"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full shadow-inner" style={{ backgroundColor: c.value }} />
                      <span className="text-[10px] text-[var(--secondary)]">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Дополнительный цвет</p>
                <div className="grid grid-cols-5 gap-2">
                  {SECONDARY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleSecondaryChange(c.value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all ${
                        secondaryColor === c.value
                          ? "border-[var(--foreground)] scale-105"
                          : "border-transparent hover:border-[var(--border)]"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full shadow-inner" style={{ backgroundColor: c.value }} />
                      <span className="text-[10px] text-[var(--secondary)]">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

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
                    <p>Задайте переменные окружения в Vercel:</p>
                    <code className="block rounded bg-[var(--bg)] p-2 mt-1">
                      SMTP_USER=your@gmail.com<br/>
                      SMTP_PASS=xxxx-xxxx-xxxx-xxxx<br/>
                      NOTIFICATION_EMAIL=your@gmail.com
                    </code>
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
                    <span className="text-sm">Supabase PostgreSQL</span>
                    <Badge variant="success">Онлайн</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Не подключена</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="h-4 w-4" />
                Экспорт / Импорт
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Экспорт JSON
              </Button>
              <label>
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Импорт JSON
                  </span>
                </Button>
              </label>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== MOBILE ===== */}
      <div className="md:hidden space-y-4">
        <div className="mobile-page-header">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
            <Button variant="outline" size="sm" onClick={fetchSettings}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Card className="mobile-widget-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              Цвета темы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Основной цвет</p>
              <div className="grid grid-cols-5 gap-2">
                {PRIMARY_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handlePrimaryChange(c.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
                      primaryColor === c.value
                        ? "border-[var(--foreground)] scale-105"
                        : "border-transparent hover:border-[var(--border)]"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full shadow-inner" style={{ backgroundColor: c.value }} />
                    <span className="text-[10px] text-[var(--secondary)]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Дополнительный цвет</p>
              <div className="grid grid-cols-5 gap-2">
                {SECONDARY_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleSecondaryChange(c.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
                      secondaryColor === c.value
                        ? "border-[var(--foreground)] scale-105"
                        : "border-transparent hover:border-[var(--border)]"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full shadow-inner" style={{ backgroundColor: c.value }} />
                    <span className="text-[10px] text-[var(--secondary)]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-widget-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Email уведомления
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                <div className="rounded-xl bg-[var(--surface)] p-3 text-xs text-[var(--secondary)] space-y-1">
                  <p>Задайте переменные окружения в Vercel:</p>
                  <code className="block rounded-lg bg-[var(--card)] p-2 mt-1 text-[10px]">
                    SMTP_USER=your@gmail.com<br/>
                    SMTP_PASS=xxxx-xxxx-xxxx-xxxx<br/>
                    NOTIFICATION_EMAIL=your@gmail.com
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mobile-widget-card">
          <CardHeader className="pb-3">
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
                  <span className="text-sm">Supabase PostgreSQL</span>
                  <Badge variant="success">Онлайн</Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Не подключена</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-widget-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" />
              Экспорт / Импорт
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex-1">
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
            <label className="flex-1">
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              <Button variant="outline" size="sm" asChild className="w-full">
                <span>
                  <Upload className="h-4 w-4" />
                  Импорт
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
