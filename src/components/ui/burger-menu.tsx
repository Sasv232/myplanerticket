"use client";

import { useId } from "react";

interface BurgerMenuProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function BurgerMenu({ checked, onChange, className }: BurgerMenuProps) {
  const id = useId();

  return (
    <label className={`burger ${className || ""}`} htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span />
      <span />
      <span />
    </label>
  );
}
