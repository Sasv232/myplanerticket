"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { Camera, ChevronRight, LogOut, Moon, Sun, Download, Upload, Shield, User, Mail, Phone, Palette } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";

const COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#22c55e", "#10b981", "#06b6d4",
];

interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
}

export function SettingsPageMobile() {
  const { user, logout } = useAuth();
  const { setOpen } = useMobileSidebar();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchProfile();
    const saved = localStorage.getItem("primaryColor") || "#3b82f6";
    setPrimaryColor(saved);
  }, [fetchProfile]);

  const handleSave = async () => {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });
    fetchProfile();
    setEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: base64 }),
      });
      fetchProfile();
    };
    reader.readAsDataURL(file);
  };

  const handleColorChange = (color: string) => {
    setPrimaryColor(color);
    localStorage.setItem("primaryColor", color);
    document.documentElement.style.setProperty("--accent", color);
  };

  const initials = profile?.name?.slice(0, 1).toUpperCase() || "?";

  return (
    <div className="mobile-main">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="h-10 w-10 rounded-2xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-7 w-7 rounded-xl object-cover" />
            ) : (
              <span className="text-sm font-bold text-[var(--accent)]">{initials}</span>
            )}
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Профиль</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Avatar + Name — centered profile card */}
        <div className="flex flex-col items-center py-4">
          <div className="relative mb-4">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-[var(--accent)]/15" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/60 text-3xl font-bold text-white ring-4 ring-[var(--accent)]/15">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] shadow-lg ring-1 ring-[var(--border)] active:scale-95 transition-all"
            >
              <Camera className="h-4 w-4 text-[var(--accent)]" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <h2 className="text-xl font-bold">{profile?.name}</h2>
          <p className="text-sm text-[var(--secondary)] mt-0.5">
            {profile?.role === "admin" ? "Администратор" : "Пользователь"}
          </p>
        </div>

        {/* Account section */}
        <div>
          <h3 className="mobile-section-header px-1 mb-2">Аккаунт</h3>
          <div className="mobile-section">
            <div className="mobile-section-row">
              <User className="h-5 w-5 text-[var(--secondary)] shrink-0" />
              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent text-[15px] outline-none"
                  placeholder="Имя"
                />
              ) : (
                <span className="flex-1 text-[15px]">{profile?.name}</span>
              )}
            </div>

            <div className="mobile-section-row">
              <Mail className="h-5 w-5 text-[var(--secondary)] shrink-0" />
              {editing ? (
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent text-[15px] outline-none"
                  placeholder="email@example.com"
                  type="email"
                />
              ) : (
                <span className="flex-1 text-[15px] text-[var(--secondary)]">{profile?.email || "Не указана"}</span>
              )}
            </div>

            <div className="mobile-section-row">
              <Phone className="h-5 w-5 text-[var(--secondary)] shrink-0" />
              {editing ? (
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent text-[15px] outline-none"
                  placeholder="+7 (999) 123-45-67"
                  type="tel"
                />
              ) : (
                <span className="flex-1 text-[15px] text-[var(--secondary)]">{profile?.phone || "Не указан"}</span>
              )}
            </div>

            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              className="mobile-section-row w-full text-left"
            >
              <div className="flex-1 text-[15px] font-medium text-[var(--accent)]">
                {editing ? "Сохранить" : "Изменить"}
              </div>
            </button>
          </div>
        </div>

        {/* Preferences section */}
        <div>
          <h3 className="mobile-section-header px-1 mb-2">Настройки</h3>
          <div className="mobile-section">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mobile-section-row w-full text-left"
            >
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-[var(--secondary)]" />
              ) : (
                <Sun className="h-5 w-5 text-[var(--secondary)]" />
              )}
              <span className="flex-1 text-[15px]">Тёмная тема</span>
              <div className={`h-7 w-12 rounded-full transition-colors duration-200 ${theme === "dark" ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 mt-1 ${theme === "dark" ? "translate-x-5.5 ml-1" : "translate-x-1"}`} />
              </div>
            </button>

            <div className="mobile-section-row">
              <Palette className="h-5 w-5 text-[var(--secondary)] shrink-0" />
              <span className="text-[15px]">Цвет акцента</span>
            </div>
            <div className="px-5 pb-4 flex gap-3 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={`h-9 w-9 rounded-full transition-all active:scale-90 ${primaryColor === c ? "ring-2 ring-offset-2 ring-[var(--foreground)] scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Support section */}
        <div>
          <h3 className="mobile-section-header px-1 mb-2">Данные</h3>
          <div className="mobile-section">
            <button
              onClick={async () => {
                const res = await fetch("/api/export");
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="mobile-section-row w-full text-left"
            >
              <Download className="h-5 w-5 text-[var(--secondary)]" />
              <span className="flex-1 text-[15px]">Экспорт данных</span>
              <ChevronRight className="h-5 w-5 text-[var(--muted)]" />
            </button>

            <label className="mobile-section-row w-full text-left cursor-pointer">
              <input type="file" accept=".json" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const data = JSON.parse(text);
                const res = await fetch("/api/export", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });
                const result = await res.json();
                if (result.ok) window.location.reload();
              }} />
              <Upload className="h-5 w-5 text-[var(--secondary)]" />
              <span className="flex-1 text-[15px]">Импорт данных</span>
              <ChevronRight className="h-5 w-5 text-[var(--muted)]" />
            </label>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--error)]/10 py-4 text-[15px] font-medium text-[var(--error)] active:scale-[0.98] transition-all"
        >
          <LogOut className="h-5 w-5" />
          Выйти из аккаунта
        </button>

        <p className="text-center text-xs text-[var(--secondary)] pb-4">v0.3.0</p>
      </div>
    </div>
  );
}
