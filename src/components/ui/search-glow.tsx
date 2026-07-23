"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchGlowProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export function SearchGlow({ icon, wrapperClassName, className, ...props }: SearchGlowProps) {
  return (
    <div className={cn("search-glow-wrap", wrapperClassName)}>
      <div className="search-glow-mask" />
      <div className="search-glow-inner">
        <div className="search-glow-icon">
          {icon || <Search className="h-4 w-4" />}
        </div>
        <input className={className} {...props} />
      </div>
    </div>
  );
}
