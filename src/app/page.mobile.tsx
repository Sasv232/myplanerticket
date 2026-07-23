"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { WidgetConfig, loadWidgetConfig } from "@/lib/widgets";
import { WidgetRendererMobile } from "@/components/widgets/widget-renderer";
import { WidgetEditor } from "@/components/widgets/widget-editor";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { Zap, Settings } from "lucide-react";

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
    <div className="mobile-main">
      <div className="mobile-page-header">
        <div className="badge badge-primary" style={{ marginBottom: 12, width: "fit-content" }}>
          <Zap className="h-3 w-3" /> Планер
        </div>
        <h1 className="mobile-page-title">
          {greeting}, {user?.name?.split(" ")[0] || ""}
        </h1>
        <p className="mobile-page-subtitle">Вот что у тебя на сегодня</p>
      </div>

      <div className="mobile-content" style={{ paddingTop: 16 }}>
        {loaded && <WidgetRendererMobile config={widgetConfig} />}
      </div>

      <button
        onClick={() => setEditorOpen(true)}
        className="mobile-fab"
        style={{ display: "flex" }}
      >
        <Settings className="h-5 w-5" />
      </button>

      <WidgetEditor open={editorOpen} onClose={() => setEditorOpen(false)} onChange={handleConfigChange} />
    </div>
  );
}
