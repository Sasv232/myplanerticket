import { cn } from "@/lib/utils";

interface TagBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "green" | "blue";
  className?: string;
}

export function TagBadge({ children, variant = "default", className }: TagBadgeProps) {
  return (
    <span className={cn(
      "tag-badge",
      variant === "accent" && "tag-badge-accent",
      variant === "green" && "tag-badge-green",
      variant === "blue" && "tag-badge-blue",
      className
    )}>
      {children}
    </span>
  );
}
