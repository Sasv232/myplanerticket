"use client";

import { ArrowLeft, MoreVertical, Trash2, Users } from "lucide-react";
import { useState } from "react";

interface ChatHeaderProps {
  conversation: {
    id: string;
    name?: string | null;
    emoji?: string | null;
    type: string;
    members?: { userId: string; userName: string; role: string }[];
  };
  currentUserId: string;
  onBack?: () => void;
  onDelete?: () => void;
  onManageMembers?: () => void;
}

export function ChatHeader({ conversation, currentUserId, onBack, onDelete, onManageMembers }: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = conversation.name || "Личный чат";
  const displayEmoji = conversation.emoji || "💬";

  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 bg-[var(--background)]">
      {onBack && (
        <button onClick={onBack} className="rounded-lg p-1.5 hover:bg-[var(--surface)] md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/15 text-lg">
        {displayEmoji}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold truncate">{displayName}</h3>
        {conversation.type === "group" && conversation.members && (
          <p className="text-xs text-[var(--muted)] truncate">
            {conversation.members.length} участников
          </p>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-1.5 hover:bg-[var(--surface)]"
        >
          <MoreVertical className="h-5 w-5 text-[var(--secondary)]" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-xl z-50 py-1">
              {conversation.type === "group" && onManageMembers && (
                <button
                  onClick={() => { onManageMembers(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--surface)]"
                >
                  <Users className="h-4 w-4" />
                  Участники
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить чат
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
