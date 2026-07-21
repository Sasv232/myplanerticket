"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, RefreshCw, CheckCircle, AlertCircle, Mail, Database, Download, Upload } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";

const PRIMARY_COLORS = [
  { name: "╨б╨╕╨╜╨╕╨╣", value: "#3b82f6", class: "blue" },
  { name: "╨Ш╨╜╨┤╨╕╨│╨╛", value: "#6366f1", class: "indigo" },
  { name: "╨д╨╕╨╛╨╗╨╡╤В╨╛╨▓╤Л╨╣", value: "#8b5cf6", class: "violet" },
  { name: "╨а╨╛╨╖╨╛╨▓╤Л╨╣", value: "#ec4899", class: "pink" },
  { name: "╨Ъ╤А╨░╤Б╨╜╤Л╨╣", value: "#ef4444", class: "red" },
  { name: "╨Ю╤А╨░╨╜╨╢╨╡╨▓╤Л╨╣", value: "#f97316", class: "orange" },
  { name: "╨п╨╜╤В╨░╤А╨╜╤Л╨╣", value: "#f59e0b", class: "amber" },
  { name: "╨Ч╨╡╨╗╤С╨╜╤Л╨╣", value: "#22c55e", class: "green" },
  { name: "╨Ш╨╖╤Г╨╝╤А╤Г╨┤╨╜╤Л╨╣", value: "#10b981", class: "emerald" },
  { name: "╨С╨╕╤А╤О╨╖╨╛╨▓╤Л╨╣", value: "#06b6d4", class: "cyan" },
];

const SECONDARY_COLORS = [
  { name: "╨б╨╡╤А╤Л╨╣", value: "#6b7280", class: "gray" },
  { name: "╨б╨╡╤А╤Л╨╣-600", value: "#4b5563", class: "gray600" },
  { name: "╨б╨╡╤А╤Л╨╣-700", value: "#374151", class: "gray700" },
  { name: "╨б╨╡╤А╤Л╨╣-800", value: "#1f2937", class: "gray800" },
  { name: "╨б╨╡╤А╤Л╨╣-900", value: "#111827", class: "gray900" },
  { name: "╨Ъ╨╛╤А╨╕╤З╨╜╨╡╨▓╤Л╨╣", value: "#78716c", class: "stone" },
  { name: "╨ж╨╕╨╜╨║╨╛╨▓╤Л╨╣", value: "#71717a", class: "zinc" },
  { name: "╨Э╨╡╨╣╤В╤А╨░╨╗╤М╨╜╤Л╨╣", value: "#737373", class: "neutral" },
  { name: "╨б╨╗╨░╨╜╤Ж╨╡╨▓╤Л╨╣", value: "#64748b", class: "slate" },
  { name: "╨в╤С╨╝╨╜╨╛-╤Б╨╕╨╜╨╕╨╣", value: "#475569", class: "darkSlate" },
];

interface Settings {
  smtpConfigured: boolean;
  databaseConnected: boolean;
}

export function SettingsPageDesktop() {
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
      alert(`╨Ш╨╝╨┐╨╛╤А╤В╨╕╤А╨╛╨▓╨░╨╜╨╛ ╨╖╨░╨┤╨░╤З: ${result.imported}`);
      window.location.reload();
    }
  };

  return (
    <div>
      <Header
        title="╨Э╨░╤Б╤В╤А╨╛╨╣╨║╨╕"
        description="╨Ъ╨╛╨╜╤Д╨╕╨│╤Г╤А╨░╤Ж╨╕╤П ╨┐╤А╨╕╨╗╨╛╨╢╨╡╨╜╨╕╤П"
        actions={
          <Button variant="outline" size="sm" onClick={fetchSettings}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            ╨Ю╨▒╨╜╨╛╨▓╨╕╤В╤М
          </Button>
        }
      />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              ╨ж╨▓╨╡╤В╨░ ╤В╨╡╨╝╤Л
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">╨Ю╤Б╨╜╨╛╨▓╨╜╨╛╨╣ ╤Ж╨▓╨╡╤В</p>
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
                    <div
                      className="h-8 w-8 rounded-full shadow-inner"
                      style={{ backgroundColor: c.value }}
                    />
                    <span className="text-[10px] text-[var(--secondary)]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">╨Ф╨╛╨┐╨╛╨╗╨╜╨╕╤В╨╡╨╗╤М╨╜╤Л╨╣ ╤Ж╨▓╨╡╤В</p>
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
                    <div
                      className="h-8 w-8 rounded-full shadow-inner"
                      style={{ backgroundColor: c.value }}
                    />
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
              Email ╤Г╨▓╨╡╨┤╨╛╨╝╨╗╨╡╨╜╨╕╤П (Gmail SMTP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings?.smtpConfigured ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">╨Э╨░╤Б╤В╤А╨╛╨╡╨╜╨╛</span>
                <Badge variant="success">╨Р╨║╤В╨╕╨▓╨╜╨╛</Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">╨Э╨╡ ╨╜╨░╤Б╤В╤А╨╛╨╡╨╜╨╛</span>
                  <Badge variant="warning">╨Ю╨╢╨╕╨┤╨░╨╡╤В</Badge>
                </div>
                <div className="rounded-lg bg-[var(--surface)] p-3 text-xs text-[var(--secondary)] space-y-1">
                  <p>╨Ч╨░╨┤╨░╨╣╤В╨╡ ╨┐╨╡╤А╨╡╨╝╨╡╨╜╨╜╤Л╨╡ ╨╛╨║╤А╤Г╨╢╨╡╨╜╨╕╤П ╨▓ Vercel:</p>
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
              ╨С╨░╨╖╨░ ╨┤╨░╨╜╨╜╤Л╤Е
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {settings?.databaseConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Supabase PostgreSQL</span>
                  <Badge variant="success">╨Ю╨╜╨╗╨░╨╣╨╜</Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">╨Э╨╡ ╨┐╨╛╨┤╨║╨╗╤О╤З╨╡╨╜╨░</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" />
              ╨н╨║╤Б╨┐╨╛╤А╤В / ╨Ш╨╝╨┐╨╛╤А╤В
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              ╨н╨║╤Б╨┐╨╛╤А╤В JSON
            </Button>
            <label>
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  ╨Ш╨╝╨┐╨╛╤А╤В JSON
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
