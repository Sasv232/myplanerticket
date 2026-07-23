"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface NeuTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function NeuTabs({ tabs, activeTab, onChange, className }: NeuTabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [gliderStyle, setGliderStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const el = tabRefs.current.get(activeTab);
    if (el) {
      setGliderStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeTab]);

  return (
    <div className={cn("neu-tabs", className)} style={{ position: "relative" }}>
      <div className="neu-tab-glider" style={gliderStyle} />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => { if (el) tabRefs.current.set(tab.id, el); }}
          className={cn("neu-tab", activeTab === tab.id && "neu-tab-active")}
          onClick={() => onChange(tab.id)}
          style={{ position: "relative", zIndex: 2 }}
        >
          {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
