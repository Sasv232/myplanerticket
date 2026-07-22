"use client";

import { useState, useEffect, useCallback } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, [supported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission === "granted") {
        new Notification(title, {
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          ...options,
        } as NotificationOptions);
      }
    },
    [permission]
  );

  const scheduleNotification = useCallback(
    (title: string, delayMs: number, options?: NotificationOptions) => {
      if (permission !== "granted") return;
      const timeoutId = setTimeout(() => {
        sendNotification(title, options);
      }, delayMs);
      return () => clearTimeout(timeoutId);
    },
    [permission, sendNotification]
  );

  return {
    supported,
    permission,
    requestPermission,
    sendNotification,
    scheduleNotification,
  };
}
