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
      <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50 px-5 py-4 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold tracking-tight">{greeting}, {user?.name?.split(" ")[0] || ""}!</p>
          <p className="text-sm text-[var(--secondary)] mt-0.5 capitalize">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <button
            onClick={() => setEditorOpen(true)}
            className="h-10 w-10 rounded-2xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150"
          >
            <Settings className="h-5 w-5 text-[var(--secondary)]" />
          </button>
          <button
            onClick={() => setOpen(true)}
            className="h-10 w-10 rounded-2xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-7 w-7 rounded-xl object-cover" />
            ) : (
              <span className="text-sm font-bold text-[var(--accent)]">{user?.name?.[0]?.toUpperCase() || "?"}</span>
            )}
          </button>
        </div>
      </div>

      {/* Widgets */}
      <div className="p-5 space-y-5">
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
