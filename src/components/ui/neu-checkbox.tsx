"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface NeuCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function NeuCheckbox({ checked, onChange, label, className }: NeuCheckboxProps) {
  const id = useId();

  return (
    <label className={cn("neu-check-container", className)} htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        className="neu-check-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="neu-check-mark" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </label>
  );
}
