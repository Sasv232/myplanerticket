"use client";

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap: Record<string, string> = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-20 w-20 text-xl",
};

const ringMap: Record<string, string> = {
  xl: "ring-4 ring-[var(--accent)]/15",
  lg: "ring-2 ring-[var(--accent)]/10",
};

const roundedMap: Record<string, string> = {
  xs: "rounded-md",
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-full",
  xl: "rounded-full",
};

export function UserAvatar({ src, name, size = "md", className = "" }: UserAvatarProps) {
  const sizeClass = sizeMap[size] || sizeMap.md;
  const ringClass = ringMap[size] || "";
  const roundedClass = roundedMap[size] || "rounded-full";
  const initial = name?.[0]?.toUpperCase() || "?";

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClass} ${roundedClass} ${ringClass} object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${roundedClass} ${ringClass} bg-[var(--accent)]/10 flex items-center justify-center font-bold text-[var(--accent)] shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
}
