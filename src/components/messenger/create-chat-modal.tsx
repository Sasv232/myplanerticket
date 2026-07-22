"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Users, Search } from "lucide-react";

interface User {
  id: string;
  name: string;
}

interface CreateChatModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { type: string; name?: string; emoji?: string; memberIds: string[] }) => void;
  onSearch: (q: string) => void;
  users: User[];
  currentUserId: string;
}

const CHAT_EMOJIS = ["💬", "🔥", "💡", "🎯", "🚀", "💻", "🎨", "📚", "🎵", "🌟"];

export function CreateChatModal({ open, onClose, onCreate, onSearch, users, currentUserId }: CreateChatModalProps) {
  const [tab, setTab] = useState<"dm" | "group">("dm");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupEmoji, setGroupEmoji] = useState("💬");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedUsers([]);
    }
  }, [open]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  }, [onSearch]);

  if (!open) return null;

  const toggleUser = (userId: string) => {
    if (tab === "dm") {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  };

  const handleCreate = () => {
    if (tab === "dm" && selectedUsers.length === 1) {
      onCreate({ type: "dm", memberIds: selectedUsers });
    } else if (tab === "group" && selectedUsers.length > 0) {
      onCreate({
        type: "group",
        name: groupName || "Групповой чат",
        emoji: groupEmoji,
        memberIds: selectedUsers,
      });
    }
    setSelectedUsers([]);
    setGroupName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-base font-bold">Новый чат</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-[var(--surface)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setTab("dm")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "dm"
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                : "text-[var(--secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            Личный чат
          </button>
          <button
            onClick={() => setTab("group")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "group"
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                : "text-[var(--secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            Группа
          </button>
        </div>

        <div className="p-4 space-y-3">
          {tab === "group" && (
            <>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-wrap">
                  {CHAT_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setGroupEmoji(e)}
                      className={`text-lg p-1 rounded-lg transition-all ${
                        groupEmoji === e ? "bg-[var(--accent)]/15 scale-110" : "hover:bg-[var(--surface)]"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                placeholder="Название группы"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              placeholder="Введите имя пользователя..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  selectedUsers.includes(user.id)
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "hover:bg-[var(--surface)] text-[var(--foreground)]"
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xs font-bold text-[var(--accent)]">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="font-medium">{user.name}</span>
                {selectedUsers.includes(user.id) && (
                  <span className="ml-auto text-[var(--accent)]">✓</span>
                )}
              </button>
            ))}
            {search.length > 0 && users.length === 0 && (
              <p className="text-center text-sm text-[var(--muted)] py-4">Пользователи не найдены</p>
            )}
            {search.length === 0 && (
              <p className="text-center text-sm text-[var(--muted)] py-4">Введите имя для поиска</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={handleCreate}
            disabled={tab === "dm" ? selectedUsers.length !== 1 : selectedUsers.length === 0}
          >
            Создать
          </Button>
        </div>
      </div>
    </div>
  );
}
