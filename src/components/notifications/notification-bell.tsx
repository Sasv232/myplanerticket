"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, X, AtSign, CheckSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Mention {
  id: string;
  commentId: string;
  fromUserName: string | null;
  taskId: string | null;
  read: boolean;
  createdAt: string;
}

interface DueTask {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
}

export function NotificationBell() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [dueTasks, setDueTasks] = useState<DueTask[]>([]);
  const [open, setOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const fetchMentions = useCallback(async () => {
    try {
      const res = await fetch("/api/mentions?t=" + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMentions(data);
      }
    } catch {}
  }, []);

  const fetchDueTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?t=" + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const today = new Date().toISOString().split("T")[0];
        const upcoming = data
          .filter((t: any) => t.dueDate && t.status !== "done" && t.dueDate <= today)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
            priority: t.priority,
          }));
        setDueTasks(upcoming);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchMentions();
    fetchDueTasks();
    const interval = setInterval(() => {
      fetchMentions();
      fetchDueTasks();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchMentions, fetchDueTasks]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasPermission(Notification.permission === "granted");
    }
  }, []);

  const unreadCount = mentions.filter((m) => !m.read).length + dueTasks.length;

  const markAllRead = async () => {
    await fetch("/api/mentions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    fetchMentions();
  };

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setHasPermission(result === "granted");
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-4 w-4 text-[var(--accent)]" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--error)] text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 z-50 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold">Уведомления</h3>
                <div className="flex items-center gap-1">
                  {!hasPermission && (
                    <Button size="sm" variant="ghost" onClick={requestPermission} className="text-[10px]">
                      Разрешить
                    </Button>
                  )}
                  {unreadCount > 0 && (
                    <Button size="sm" variant="ghost" onClick={markAllRead} className="text-[10px]">
                      Прочитать все
                    </Button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {dueTasks.length > 0 && (
                  <div className="p-2">
                    <p className="text-[10px] font-semibold text-[var(--error)] px-2 py-1">Просроченные задачи</p>
                    {dueTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--surface)]">
                        <CheckSquare className="h-3.5 w-3.5 text-[var(--error)] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{task.title}</p>
                          <p className="text-[10px] text-[var(--muted)]">
                            {new Date(task.dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {mentions.length > 0 && (
                  <div className="p-2">
                    <p className="text-[10px] font-semibold text-[var(--accent)] px-2 py-1">Упоминания</p>
                    {mentions.map((m) => (
                      <div key={m.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--surface)] ${!m.read ? "bg-[var(--accent)]/5" : ""}`}>
                        <AtSign className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">
                            <span className="text-[var(--accent)]">{m.fromUserName || "Аноним"}</span> упомянул вас
                          </p>
                          <p className="text-[10px] text-[var(--muted)]">
                            {new Date(m.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {dueTasks.length === 0 && mentions.length === 0 && (
                  <div className="p-6 text-center text-xs text-[var(--secondary)]">
                    Нет уведомлений
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
