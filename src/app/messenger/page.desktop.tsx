"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { ConversationList } from "@/components/messenger/conversation-list";
import { ChatHeader } from "@/components/messenger/chat-header";
import { MessageBubble } from "@/components/messenger/message-bubble";
import { MessageInput } from "@/components/messenger/message-input";
import { TypingIndicator } from "@/components/messenger/typing-indicator";
import { CreateChatModal } from "@/components/messenger/create-chat-modal";

import { MessageSquare } from "lucide-react";

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

export function MessengerDesktop() {
  const { user } = useAuth();
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
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
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
        if (res.ok) {
          const data = await res.json();
          setTypingUsers(data);
        }
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
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, lastMessage: optimisticMsg }
          : c
      )
    );

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConvId, content }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, lastMessage: saved } : c
          )
        );
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

  return (
    <>
      <Header title="Мессенджер" />

      <CreateChatModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateChat}
        onSearch={searchUsers}
        users={allUsers}
        currentUserId={user?.id || ""}
      />

      <div className="flex h-[calc(100vh-4rem)] border-t border-[var(--border)]">
        <div className="w-80 border-r border-[var(--border)] bg-[var(--background)] shrink-0">
          <ConversationList
            conversations={conversations}
            activeId={activeConvId}
            currentUserId={user?.id || ""}
            onSelect={setActiveConvId}
            onCreateNew={() => setShowCreateModal(true)}
          />
        </div>

        <div className="flex-1 flex flex-col bg-[var(--background)]">
          {activeConv ? (
            <>
              <ChatHeader
                conversation={activeConv}
                currentUserId={user?.id || ""}
                onDelete={handleDelete}
              />

              <div className="flex-1 overflow-y-auto py-4 space-y-2">
                {messages.map((msg, i) => {
                  const isOwn = msg.userId === user?.id;
                  const showAuthor =
                    i === 0 || messages[i - 1].userId !== msg.userId;
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

              <MessageInput
                onSend={handleSend}
                onTyping={handleTyping}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)]/10 mb-4">
                <MessageSquare className="h-10 w-10 text-[var(--accent)]" />
              </div>
              <h3 className="text-lg font-bold mb-1">Мессенджер</h3>
              <p className="text-sm text-[var(--muted)] max-w-xs">
                Выберите чат или создайте новый для общения с другими пользователями
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
