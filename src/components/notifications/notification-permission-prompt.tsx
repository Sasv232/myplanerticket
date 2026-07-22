"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { subscribeToPush } from "@/lib/push-client";

export function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    const dismissed = localStorage.getItem("notif_prompt_dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    const ok = await subscribeToPush();
    setLoading(false);
    setShow(false);
    if (!ok) {
      localStorage.setItem("notif_prompt_dismissed", "1");
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("notif_prompt_dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-2xl">
        <div className="flex justify-end">
          <button onClick={handleDismiss} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[var(--surface)] transition-colors">
            <X className="h-4 w-4 text-[var(--secondary)]" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10 mb-4">
            <Bell className="h-8 w-8 text-[var(--accent)]" />
          </div>

          <h2 className="text-lg font-bold mb-2">Включить уведомления?</h2>
          <p className="text-sm text-[var(--secondary)] mb-6">
            Мы будем присылать уведомления о сообщениях, дедлайнах задач и напоминания о привычках. Вы можете отключить их в настройках.
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 rounded-2xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--surface)] transition-colors"
            >
              Не сейчас
            </button>
            <button
              onClick={handleAllow}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Подождите..." : "Разрешить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
