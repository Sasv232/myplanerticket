import { cn } from "@/lib/utils";

interface FloatingCardProps {
  children: React.ReactNode;
  offset?: 1 | 2 | 3 | 4;
  className?: string;
}

export function FloatingCard({ children, offset, className }: FloatingCardProps) {
  return (
    <div className={cn(
      "floating-card",
      offset === 1 && "floating-card-offset-1",
      offset === 2 && "floating-card-offset-2",
      offset === 3 && "floating-card-offset-3",
      offset === 4 && "floating-card-offset-4",
      className
    )}>
      {children}
    </div>
  );
}
