import { cn } from "@/lib/utils";

interface SpinCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SpinCard({ children, className }: SpinCardProps) {
  return (
    <div className={cn("spin-card", className)}>
      <div className="spin-card-border">
        <div className="spin-card-border-inner" />
      </div>
      <div className="spin-card-content">
        {children}
      </div>
    </div>
  );
}
