"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WidgetDef } from "@/lib/widgets";

interface WidgetCardProps {
  widget: WidgetDef;
  children: ReactNode;
  compact?: boolean;
}

export function WidgetCard({ widget, children, compact }: WidgetCardProps) {
  return (
    <Card elevated className="overflow-hidden">
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">{widget.icon}</span>
          <p className="text-[12px] font-semibold text-[var(--foreground)]">{widget.name}</p>
          <div className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: widget.color }} />
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
