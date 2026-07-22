"use client";

interface TypingIndicatorProps {
  names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const text =
    names.length === 1
      ? `${names[0]} печатает`
      : names.length === 2
      ? `${names[0]} и ${names[1]} печатают`
      : `${names[0]} и ${names.length - 1} других печатают`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-[var(--muted)]">{text}</span>
    </div>
  );
}
