"use client";

import { cn } from "@/lib/utils";

type BlobColor = "accent" | "green" | "blue" | "orange" | "purple" | "pink";

interface BlobBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  variant?: BlobColor;
}

export function BlobBackground({ children, className, variant = "accent" }: BlobBackgroundProps) {
  const colors: Record<BlobColor, string> = {
    accent: "rgba(255, 77, 77, 0.1)",
    green: "rgba(34, 197, 94, 0.08)",
    blue: "rgba(59, 130, 246, 0.08)",
    orange: "rgba(255, 107, 53, 0.08)",
    purple: "rgba(168, 85, 247, 0.08)",
    pink: "rgba(236, 72, 153, 0.08)",
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600, height: 600,
          top: -200, right: -150,
          background: `radial-gradient(circle, ${colors[variant]} 0%, transparent 70%)`,
          animation: "blob-float 20s ease-in-out infinite",
          zIndex: 0,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500, height: 500,
          bottom: -150, left: -100,
          background: `radial-gradient(circle, ${colors.green} 0%, transparent 70%)`,
          animation: "blob-float 25s ease-in-out infinite reverse",
          zIndex: 0,
        }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

interface GlassStatProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  blob?: BlobColor;
  className?: string;
}

export function GlassStat({ icon, value, label, blob = "green", className }: GlassStatProps) {
  return (
    <div className={cn("glass-card", className)}>
      <div className="glass-stat">
        <div className="glass-stat-icon" style={{ background: `var(--${blob === "accent" ? "accent" : blob === "green" ? "green-light" : blob === "blue" ? "blue-light" : "bg-alt"})` }}>
          {icon}
        </div>
        <div>
          <div className="glass-stat-value">{value}</div>
          <div className="glass-stat-label">{label}</div>
        </div>
      </div>
    </div>
  );
}
