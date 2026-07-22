"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ConversationList } from "@/components/messenger/conversation-list";
import { ChatHeader } from "@/components/messenger/chat-header";
import { MessageBubble } from "@/components/messenger/message-bubble";
import { MessageInput } from "@/components/messenger/message-input";
import { TypingIndicator } from "@/components/messenger/typing-indicator";
import { CreateChatModal } from "@/components/messenger/create-chat-modal";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { useLang } from "@/lib/i18n/context";
import { Home } from "lucide-react";

interface Message {
  id: string;
  userId: string;
  content: string;
  type: string;
  createdAt: string;
  userName: string;
}

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
  lastMessage?: Message | null;
  unreadCount: number;
}

interface TypingUser {
  userId: string;
  userName: string;
}

export function MessengerMobile() {
  const { user } = useAuth();
  const { setOpen } = useMobileSidebar();
  const { t } = useLang();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        await fetch("/api/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId }),
        });
      }
    } catch {}
  }, []);

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 1) { setAllUsers([]); return; }
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (activeConvId) fetchMessages(activeConvId);
  }, [activeConvId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConvId) return;
    const interval = setInterval(() => fetchMessages(activeConvId), 3000);
    return () => clearInterval(interval);
  }, [activeConvId, fetchMessages]);

  useEffect(() => {
    if (!activeConvId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/typing?conversationId=${activeConvId}`);
        if (res.ok) setTypingUsers(await res.json());
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  const handleSend = useCallback(async (content: string) => {
    if (!activeConvId || !user) return;

    const tempId = "temp_" + Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      userId: user.id,
      content,
      type: "text",
      createdAt: new Date().toISOString(),
      userName: user.name,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConvId, content }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [activeConvId, user]);

  const handleTyping = useCallback(async () => {
    if (!activeConvId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: activeConvId }),
        });
      } catch {}
    }, 500);
  }, [activeConvId]);

  const handleCreateChat = useCallback(async (data: { type: string; name?: string; emoji?: string; memberIds: string[] }) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const conv = await res.json();
        await fetchConversations();
        setActiveConvId(conv.id);
      }
    } catch {}
  }, [fetchConversations]);

  const handleDelete = useCallback(async () => {
    if (!activeConvId) return;
    if (!confirm("Удалить этот чат?")) return;
    try {
      await fetch(`/api/conversations/${activeConvId}`, { method: "DELETE" });
      setActiveConvId(null);
      setMessages([]);
      await fetchConversations();
    } catch {}
  }, [activeConvId, fetchConversations]);

  const handleDeleteMessage = useCallback(async (msgId: string) => {
    try {
      await fetch(`/api/messages/${msgId}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch {}
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const showChatList = !activeConvId;

  return (
    <>
      <CreateChatModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateChat}
        onSearch={searchUsers}
        users={allUsers}
        currentUserId={user?.id || ""}
      />

      {showChatList ? (
        <div className="mobile-main">
          {/* Header */}
          <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="h-9 w-9 rounded-xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150 shrink-0"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-6 w-6 rounded-lg object-cover" />
              ) : (
                <span className="text-xs font-bold text-[var(--accent)]">M</span>
              )}
            </button>
            <Link href="/" className="h-9 w-9 rounded-xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150 shrink-0">
              <Home className="h-4 w-4" />
            </Link>
            <h1 className="flex-1 text-lg font-bold tracking-tight truncate">Чаты</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 active:scale-95 transition-all duration-150 shrink-0"
            >
              <span className="text-[var(--accent)] text-lg">+</span>
            </button>
          </div>

          <div className="h-[calc(100vh-140px)]">
            <ConversationList
              conversations={conversations}
              activeId={activeConvId}
              currentUserId={user?.id || ""}
              onSelect={setActiveConvId}
              onCreateNew={() => setShowCreateModal(true)}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
          <ChatHeader
            conversation={activeConv!}
            currentUserId={user?.id || ""}
            onBack={() => { setActiveConvId(null); setMessages([]); }}
            onDelete={handleDelete}
          />

          <div className="flex-1 overflow-y-auto py-5 space-y-2">
            {messages.map((msg, i) => {
              const isOwn = msg.userId === user?.id;
              const showAuthor = i === 0 || messages[i - 1].userId !== msg.userId;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={isOwn}
                  showAuthor={showAuthor}
                  onDelete={isOwn ? handleDeleteMessage : undefined}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <TypingIndicator names={typingUsers.map((t) => t.userName)} />

          <MessageInput onSend={handleSend} onTyping={handleTyping} />
        </div>
      )}
    </>
  );
}
