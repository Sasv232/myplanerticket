"use client";

import { useState, useEffect } from "react";
import { WidgetConfig, AVAILABLE_WIDGETS, loadWidgetConfig, saveWidgetConfig } from "@/lib/widgets";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Check, ChevronUp, ChevronDown, Plus, X } from "lucide-react";

interface WidgetEditorProps {
  open: boolean;
  onClose: () => void;
  onChange?: (config: WidgetConfig[]) => void;
}

function mergeWidgets(saved: WidgetConfig[]): WidgetConfig[] {
  return AVAILABLE_WIDGETS.map((def, i) => {
    const found = saved.find((w) => w.id === def.id);
    return {
      id: def.id,
      enabled: found ? found.enabled : ["task-stats", "weather", "currency", "habits-today", "upcoming", "pomodoro"].includes(def.id),
      order: found ? found.order : i,
    };
  });
}

export function WidgetEditor({ open, onClose, onChange }: WidgetEditorProps) {
  const [local, setLocal] = useState<WidgetConfig[]>(() => mergeWidgets([]));

  useEffect(() => {
    if (open) {
      setLocal(mergeWidgets(loadWidgetConfig()));
    }
  }, [open]);

  const toggleWidget = (id: string) => {
    setLocal((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const moveUp = (id: string) => {
    setLocal((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((w) => w.id === id);
      if (idx <= 0) return prev;
      [sorted[idx - 1], sorted[idx]] = [sorted[idx], sorted[idx - 1]];
      return sorted.map((w, i) => ({ ...w, order: i }));
    });
  };

  const moveDown = (id: string) => {
    setLocal((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((w) => w.id === id);
      if (idx >= sorted.length - 1) return prev;
      [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
      return sorted.map((w, i) => ({ ...w, order: i }));
    });
  };

  const handleSave = () => {
    saveWidgetConfig(local);
    if (onChange) onChange(local);
    onClose();
  };

  const sorted = [...local].sort((a, b) => a.order - b.order);
  const enabledCount = local.filter((w) => w.enabled).length;

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Настроить дашборд</ModalTitle>
          <ModalDescription>
            Включите виджеты и измените порядок
          </ModalDescription>
        </ModalHeader>

        <p className="text-[12px] font-medium text-[var(--secondary)]">
          Активно: <span className="font-bold text-[var(--foreground)]">{enabledCount}</span> из {AVAILABLE_WIDGETS.length}
        </p>

        <div style={{ maxHeight: "50vh", overflowY: "auto" }} className="space-y-2 pr-1">
          {sorted.map((w, idx) => {
            const def = AVAILABLE_WIDGETS.find((d) => d.id === w.id);
            if (!def) return null;
            return (
              <div
                key={w.id}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-150"
                style={{
                  borderColor: w.enabled ? def.color + "40" : "var(--border)",
                  backgroundColor: w.enabled ? def.color + "08" : "var(--card)",
                }}
              >
                <div
                  className="text-2xl shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: def.color + "15" }}
                >
                  {def.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">{def.name}</p>
                  <p className="text-[10px] text-[var(--secondary)]">{def.description}</p>
                </div>

                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => moveUp(w.id)}
                    disabled={idx === 0}
                    className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-[var(--surface)] transition-colors text-[var(--secondary)] disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(w.id)}
                    disabled={idx === sorted.length - 1}
                    className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-[var(--surface)] transition-colors text-[var(--secondary)] disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => toggleWidget(w.id)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0"
                  style={{
                    backgroundColor: w.enabled ? "#16a34a" : "var(--surface)",
                    color: w.enabled ? "#fff" : "var(--secondary)",
                    border: w.enabled ? "none" : "1px solid var(--border)",
                  }}
                >
                  {w.enabled ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
