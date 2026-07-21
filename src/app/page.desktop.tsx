"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { WidgetConfig, loadWidgetConfig } from "@/lib/widgets";
import { WidgetRenderer } from "@/components/widgets/widget-renderer";
import { WidgetEditor } from "@/components/widgets/widget-editor";
import { Settings } from "lucide-react";

export function DashboardPageDesktop() {
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

  return (
    <>
      <Header
        title="Дашборд"
        description="Персональная панель управления"
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
            <Settings className="h-4 w-4 mr-1.5" />
            Настроить
          </Button>
        }
      />
      <main className="p-6">
        {loaded && (
          <WidgetRenderer config={widgetConfig} columns={2} />
        )}
      </main>
      <WidgetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        config={widgetConfig}
        onChange={handleConfigChange}
      />
    </>
  );
}
