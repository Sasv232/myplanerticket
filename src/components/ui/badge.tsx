import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)]/15 text-[var(--accent)]",
        secondary:
          "bg-[var(--surface)] text-[var(--secondary)] border border-[var(--border)]",
        destructive:
          "bg-[var(--error)]/15 text-[var(--error)]",
        success:
          "bg-[var(--success)]/15 text-[var(--success)]",
        warning:
          "bg-[var(--warning)]/15 text-[var(--warning)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
