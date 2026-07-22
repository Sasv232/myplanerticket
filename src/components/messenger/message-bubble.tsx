"use client";

import { useState } from "react";

interface MessageBubbleProps {
  message: {
    id: string;
    userId: string;
    content: string;
    type: string;
    createdAt: string;
    userName: string;
  };
  isOwn: boolean;
  showAuthor: boolean;
  onDelete?: (id: string) => void;
}

export function MessageBubble({ message, isOwn, showAuthor, onDelete }: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const time = new Date(message.createdAt).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`group flex flex-col ${isOwn ? "items-end" : "items-start"} px-5`}>
      {showAuthor && !isOwn && (
        <span className="mb-1 ml-1 text-xs font-semibold text-[var(--accent)]">
          {message.userName}
        </span>
      )}

      <div className="relative max-w-[80%]">
        <div
          className={`px-4 py-3 text-[15px] leading-relaxed ${
            isOwn
              ? "mobile-bubble-own"
              : "mobile-bubble-other"
          }`}
          onDoubleClick={() => onDelete && setMenuOpen(true)}
        >
          {message.content}
        </div>

        <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
          <span className="text-[11px] text-[var(--muted)]">{time}</span>
        </div>

        {menuOpen && isOwn && onDelete && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl py-1 min-w-[120px]">
              <button
                onClick={() => { onDelete(message.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[var(--error)] hover:bg-[var(--error)]/5"
              >
                Удалить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
