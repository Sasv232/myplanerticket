"use client";

import { useState } from "react";
import { WidgetConfig, AVAILABLE_WIDGETS, saveWidgetConfig } from "@/lib/widgets";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Minus, Check } from "lucide-react";

interface WidgetEditorProps {
  open: boolean;
  onClose: () => void;
  config: WidgetConfig[];
  onChange: (config: WidgetConfig[]) => void;
}

export function WidgetEditor({ open, onClose, config, onChange }: WidgetEditorProps) {
  const [local, setLocal] = useState<WidgetConfig[]>([...config]);

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
    onChange(local);
    saveWidgetConfig(local);
    onClose();
  };

  const sorted = [...local].sort((a, b) => a.order - b.order);
  const enabledCount = local.filter((w) => w.enabled).length;

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Настроить дашборд</ModalTitle>
          <ModalDescription>
            Выберите виджеты и порядок отображения
          </ModalDescription>
        </ModalHeader>

        <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6 py-2">
          <p className="text-[11px] text-[var(--secondary)] mb-3">
            {enabledCount} из {AVAILABLE_WIDGETS.length} виджетов активно
          </p>
          <div className="space-y-2">
            {sorted.map((w) => {
              const def = AVAILABLE_WIDGETS.find((d) => d.id === w.id);
              if (!def) return null;
              return (
                <div
                  key={w.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    w.enabled
                      ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                      : "border-[var(--border)] bg-[var(--card)] opacity-60"
                  }`}
                >
                  <div className="text-2xl shrink-0">{def.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold">{def.name}</p>
                    <p className="text-[10px] text-[var(--secondary)]">{def.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveUp(w.id)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--surface)] transition-colors text-[var(--secondary)]"
                      disabled={sorted[0]?.id === w.id}
                    >
                      <GripVertical className="h-3.5 w-3.5 rotate-90" />
                    </button>
                    <button
                      onClick={() => toggleWidget(w.id)}
                      className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                        w.enabled
                          ? "bg-[var(--success)] text-white"
                          : "bg-[var(--surface)] text-[var(--secondary)]"
                      }`}
                    >
                      {w.enabled ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
