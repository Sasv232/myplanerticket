"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { WidgetConfig, loadWidgetConfig } from "@/lib/widgets";
import { WidgetRenderer } from "@/components/widgets/widget-renderer";
import { WidgetEditor } from "@/components/widgets/widget-editor";
import { BlobBackground } from "@/components/ui/glass-card";
import { TagBadge } from "@/components/ui/tag-badge";
import { Settings, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function DashboardPageDesktop() {
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setWidgetConfig(loadWidgetConfig());
    setLoaded(true);
  }, []);

  const handleConfigChange = useCallback((newConfig: WidgetConfig[]) => {
    setWidgetConfig(newConfig);
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  return (
    <BlobBackground variant="accent" className="min-h-screen">
      <div className="p-8">
        {/* Hero */}
        <div className="mb-8">
          <TagBadge variant="green" className="mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Персональный планер
          </TagBadge>
          <h1 className="heading-xl mb-2">
            {greeting}, {user?.name?.split(" ")[0] || ""} 👋
          </h1>
          <p className="text-body text-[var(--text-secondary)]">
            Вот что у тебя на сегодня
          </p>
        </div>

        {/* Виджеты */}
        {loaded && (
          <WidgetRenderer config={widgetConfig} columns={2} />
        )}

        {/* Кнопка настроек */}
        <div className="mt-6">
          <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
            <Settings className="h-4 w-4 mr-1.5" />
            Настроить виджеты
          </Button>
        </div>
      </div>

      <WidgetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onChange={handleConfigChange}
      />
    </BlobBackground>
  );
}
