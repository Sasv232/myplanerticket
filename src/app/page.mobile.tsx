"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { WidgetConfig, loadWidgetConfig } from "@/lib/widgets";
import { WidgetRendererMobile } from "@/components/widgets/widget-renderer";
import { WidgetEditor } from "@/components/widgets/widget-editor";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { TagBadge } from "@/components/ui/tag-badge";
import { Settings, Sparkles } from "lucide-react";

export function DashboardPageMobile() {
  const { user } = useAuth();
  const { setOpen } = useMobileSidebar();
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
    <div className="mobile-main blob-bg">
      <div className="px-5 pt-14 pb-2">
        <TagBadge variant="green" className="mb-3">
          <Sparkles className="h-3 w-3" />
          Планер
        </TagBadge>
        <h1 className="text-[26px] font-extrabold tracking-tight leading-tight">
          {greeting}, {user?.name?.split(" ")[0] || ""} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Вот что у тебя на сегодня
        </p>
      </div>

      <div className="p-5 space-y-4">
        {loaded && <WidgetRendererMobile config={widgetConfig} />}
      </div>

      <button
        onClick={() => setEditorOpen(true)}
        className="mobile-fab"
        style={{ display: "flex" }}
      >
        <Settings className="h-5 w-5" />
      </button>

      <WidgetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onChange={handleConfigChange}
      />
    </div>
  );
}
