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
    <div className={`group flex flex-col ${isOwn ? "items-end" : "items-start"} px-4`}>
      {showAuthor && !isOwn && (
        <span className="mb-1 ml-1 text-[11px] font-semibold text-[var(--accent)]">
          {message.userName}
        </span>
      )}

      <div className="relative max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? "bg-[var(--accent)] text-white rounded-br-md"
              : "bg-[var(--surface)] text-[var(--foreground)] rounded-bl-md border border-[var(--border)]"
          }`}
          onDoubleClick={() => onDelete && setMenuOpen(true)}
        >
          {message.content}
        </div>

        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-[var(--muted)]">{time}</span>
        </div>

        {menuOpen && isOwn && onDelete && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg py-1">
              <button
                onClick={() => { onDelete(message.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
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
