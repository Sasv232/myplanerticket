"use client";

import { useState } from "react";
import { MessageSquare, Search, Plus, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Member {
  userId: string;
  userName: string;
  userAvatar?: string | null;
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

function Avatar({ name, avatar, size = "md" }: { name: string; avatar?: string | null; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-10 w-10 text-xs" : "h-12 w-12 text-sm";
  if (avatar) {
    return <img src={avatar} alt="" className={`${s} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${s} flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/60 font-bold text-white shrink-0`}>
      {name[0]?.toUpperCase() || "?"}
    </div>
  );
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

  const getOtherMember = (conv: Conversation) => {
    return conv.members.find((m) => m.userId !== currentUserId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-5 py-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Поиск чатов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mobile-input pl-12"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-14 w-14 text-[var(--muted)] mb-4" />
            <p className="text-base font-semibold text-[var(--secondary)]">Нет чатов</p>
            <p className="text-sm text-[var(--muted)] mt-1">Создайте новый чат</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeId;
            const convName = getConvName(conv);
            const other = getOtherMember(conv);
            const lastMsg = conv.lastMessage;
            const lastTime = lastMsg
              ? formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true, locale: ru })
              : "";

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 transition-all active:scale-[0.98] ${
                  isActive ? "bg-[var(--accent)]/8" : "active:bg-[var(--surface)]"
                }`}
              >
                {conv.type === "group" ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xl shrink-0">
                    {conv.emoji || "👥"}
                  </div>
                ) : (
                  <Avatar name={convName} avatar={other?.userAvatar} />
                )}

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold truncate">{convName}</span>
                    {lastTime && (
                      <span className="text-[11px] text-[var(--muted)] shrink-0 ml-3">{lastTime}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {conv.type === "group" && (
                      <Users className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
                    )}
                    <p className="text-sm text-[var(--muted)] truncate">
                      {lastMsg
                        ? `${lastMsg.userId === currentUserId ? "Вы: " : ""}${lastMsg.content}`
                        : "Нет сообщений"}
                    </p>
                  </div>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--accent)] px-2 text-[11px] font-bold text-white shrink-0">
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
