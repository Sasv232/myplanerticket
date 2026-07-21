import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all duration-150 ease-in-out",
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
        urgent:
          "bg-red-50 text-red-600 border border-red-200 font-bold dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
        high:
          "bg-orange-50 text-orange-600 border border-orange-200 font-semibold dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30",
        medium:
          "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
        low:
          "bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30",
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
