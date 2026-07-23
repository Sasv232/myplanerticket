"use client";

import { useId } from "react";

interface ThemeSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function ThemeSwitch({ checked = false, onChange, className }: ThemeSwitchProps) {
  const id = useId();

  return (
    <div className={`theme-switch ${className || ""}`}>
      <input
        type="checkbox"
        id={id}
        className="theme-switch__checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <label className="theme-switch__container" htmlFor={id}>
        <div className="theme-switch__circle-container">
          <div className="theme-switch__sun-moon-container">
            <div className="theme-switch__moon">
              <span className="theme-switch__spot" />
              <span className="theme-switch__spot" />
              <span className="theme-switch__spot" />
            </div>
          </div>
        </div>
        <div className="theme-switch__clouds" />
        <svg className="theme-switch__stars-container" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
        </svg>
      </label>
    </div>
  );
}
