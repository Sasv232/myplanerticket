"use client";

interface ThemeSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function ThemeSwitch({ checked = false, onChange, className }: ThemeSwitchProps) {
  return (
    <button
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
        checked
          ? "bg-[var(--text)]"
          : "bg-[var(--border)]"
      } ${className || ""}`}
      style={{
        boxShadow: checked
          ? "inset 0 2px 4px rgba(0,0,0,0.3)"
          : "inset 0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* Иконки */}
      <span
        className="absolute left-1 text-[11px] transition-opacity duration-200"
        style={{ opacity: checked ? 0 : 1 }}
      >
        ☀️
      </span>
      <span
        className="absolute right-1 text-[11px] transition-opacity duration-200"
        style={{ opacity: checked ? 1 : 0 }}
      >
        🌙
      </span>

      {/* Кружок */}
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white transition-transform duration-300 shadow-md ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
