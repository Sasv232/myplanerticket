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
    <div className="sticky top-0 z-30 flex items-center gap-3 px-5 py-3 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50" style={{ paddingTop: "calc(12px + env(safe-area-inset-top, 0px))" }}>
      {onBack && (
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] active:scale-95 transition-all duration-150 md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)]/10 text-lg shrink-0">
        {displayEmoji}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold truncate">{displayName}</h3>
        {conversation.type === "group" && conversation.members && (
          <p className="text-xs text-[var(--muted)] truncate">
            {conversation.members.length} участников
          </p>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl active:scale-95 transition-all duration-150"
        >
          <MoreVertical className="h-5 w-5 text-[var(--secondary)]" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl z-50 py-2 overflow-hidden">
              {conversation.type === "group" && onManageMembers && (
                <button
                  onClick={() => { onManageMembers(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[var(--surface)] transition-colors"
                >
                  <Users className="h-4 w-4 text-[var(--secondary)]" />
                  Участники
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--error)] hover:bg-[var(--error)]/5 transition-colors"
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
