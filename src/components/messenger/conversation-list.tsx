"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Search, Plus, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Member {
  userId: string;
  userName: string;
  role: string;
}

interface Conversation {
  id: string;
  type: string;
  name?: string | null;
  emoji?: string | null;
  createdBy: string;
  createdAt: string;
  members: Member[];
  lastMessage?: {
    content: string;
    userId: string;
    createdAt: string;
    userName: string;
  } | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}

export function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  onCreateNew,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const name = c.name || c.members.find((m) => m.userId !== currentUserId)?.userName || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const getConvName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    const other = conv.members.find((m) => m.userId !== currentUserId);
    return other?.userName || "Без имени";
  };

  const getConvEmoji = (conv: Conversation) => {
    if (conv.emoji) return conv.emoji;
    if (conv.type === "group") return "👥";
    return getConvName(conv)[0]?.toUpperCase() || "💬";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-base font-bold">Чаты</h2>
        <button
          onClick={onCreateNew}
          className="rounded-lg p-1.5 hover:bg-[var(--surface)] transition-colors"
        >
          <Plus className="h-5 w-5 text-[var(--secondary)]" />
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Поиск чатов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-[var(--muted)] mb-3" />
            <p className="text-sm font-medium text-[var(--secondary)]">Нет чатов</p>
            <p className="text-xs text-[var(--muted)] mt-1">Создайте новый чат</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeId;
            const convName = getConvName(conv);
            const convEmoji = getConvEmoji(conv);
            const lastMsg = conv.lastMessage;
            const lastTime = lastMsg
              ? formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true, locale: ru })
              : "";

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 transition-all ${
                  isActive
                    ? "bg-[var(--accent)]/10"
                    : "hover:bg-[var(--surface)]"
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)]/15 text-base shrink-0">
                  {convEmoji}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate">{convName}</span>
                    {lastTime && (
                      <span className="text-[10px] text-[var(--muted)] shrink-0 ml-2">{lastTime}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {conv.type === "group" && (
                      <Users className="h-3 w-3 text-[var(--muted)] shrink-0" />
                    )}
                    <p className="text-xs text-[var(--muted)] truncate">
                      {lastMsg
                        ? `${lastMsg.userId === currentUserId ? "Вы: " : ""}${lastMsg.content}`
                        : "Нет сообщений"}
                    </p>
                  </div>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-bold text-white shrink-0">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
