"use client";

import { useState, useEffect, useCallback } from "react";
import { WidgetConfig, loadWidgetConfig } from "@/lib/widgets";
import { WidgetRendererMobile } from "@/components/widgets/widget-renderer";
import { WidgetEditor } from "@/components/widgets/widget-editor";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { useAuth } from "@/lib/auth-context";
import { Settings } from "lucide-react";

export function DashboardPageMobile() {
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();
  const { setOpen } = useMobileSidebar();

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
  const dateStr = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" });

  return (
    <div className="mobile-main">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--background)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold truncate">{greeting}, {user?.name?.split(" ")[0] || ""}!</p>
          <p className="text-[11px] text-[var(--secondary)] capitalize">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button onClick={() => setEditorOpen(true)} className="h-9 w-9 rounded-xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-transform">
            <Settings className="h-4 w-4 text-[var(--secondary)]" />
          </button>
          <button onClick={() => setOpen(true)} className="h-9 w-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center active:scale-95 transition-transform">
            <span className="text-sm font-bold text-[var(--accent)]">{user?.name?.[0]?.toUpperCase() || "?"}</span>
          </button>
        </div>
      </div>

      {/* Widgets */}
      <div className="p-4">
        {loaded && <WidgetRendererMobile config={widgetConfig} />}
      </div>

      {/* Editor */}
      <WidgetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onChange={handleConfigChange}
      />
    </div>
  );
}
