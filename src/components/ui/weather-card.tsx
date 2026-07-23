"use client";

import { cn } from "@/lib/utils";

interface WeatherCardProps {
  city: string;
  temp: string;
  description: string;
  details?: { label: string; value: string }[];
  footer?: string;
  children?: React.ReactNode;
  className?: string;
}

export function WeatherCard({ city, temp, description, details, footer, children, className }: WeatherCardProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="weather-card">
        <div className="weather-card-inner">
          {children}
          <div style={{ fontSize: "0.9em", fontWeight: 700 }}>{city}</div>
          <div className="weather-card-main">{temp}</div>
          <div className="weather-card-sub">{description}</div>
          {details && details.length > 0 && (
            <div className="weather-card-row" style={{ clear: "right" }}>
              {details.map((d) => (
                <span key={d.label}>{d.label}: {d.value}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {footer && <div className="weather-card-footer">{footer}</div>}
    </div>
  );
}
