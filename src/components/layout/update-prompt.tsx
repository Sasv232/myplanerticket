"use client";

import { useState, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";

export function UpdatePrompt() {
  const [show, setShow] = useState(false);
  const [version, setVersion] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") {
        setVersion(event.data.version || "");
        setShow(true);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    });

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[60] lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 shrink-0">
          <RefreshCw className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Доступна новая версия</p>
          {version && (
            <p className="text-xs text-[var(--secondary)]">v{version}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleUpdate}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Обновить
          </button>
          <button
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[var(--surface)] transition-colors"
          >
            <X className="h-4 w-4 text-[var(--secondary)]" />
          </button>
        </div>
      </div>
    </div>
  );
}
