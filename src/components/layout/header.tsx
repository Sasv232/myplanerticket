"use client";

import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <div className="hidden lg:flex items-start justify-between pb-6">
      <div>
        <h1 className="heading-lg">{title}</h1>
        {description && (
          <p className="mt-1.5 text-body text-[var(--secondary)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
