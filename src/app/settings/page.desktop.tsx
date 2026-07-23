"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/components/layout/theme-provider";
import { useLang } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push-client";
import {
  Palette, RefreshCw, CheckCircle, AlertCircle, Mail, Database,
  Download, Upload, Bell, Camera, User, Phone, Globe,
} from "lucide-react";

const COLORS = ["#6366f1","#10b981","#3b82f6","#8b5cf6","#ec4899","#ef4444","#f97316","#f59e0b","#22c55e","#06b6d4"];

interface Settings { smtpConfigured: boolean; databaseConnected: boolean; }
interface Profile { id: string; name: string; email: string | null; phone: string | null; avatar: string | null; role: string; createdAt: string; }

export function SettingsPageDesktop() {
  const { theme, schedule, setSchedule } = useTheme();
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [notifPrefs, setNotifPrefs] = useState({ messenger: true, deadlines: true, habits: true, serverErrors: true, maintenance: true, reminderTime: "20:00" });
  const [pushEnabled, setPushEnabled] = useState(false);

  const fetchNotifPrefs = useCallback(async () => {
    try { const res = await fetch("/api/push/preferences"); if (res.ok) setNotifPrefs(await res.json()); } catch {}
  }, []);
  const updateNotifPref = async (key: string, value: boolean | string) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    await fetch("/api/push/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
  };
  const handleTogglePush = async () => {
    if (pushEnabled) { await unsubscribeFromPush(); setPushEnabled(false); }
    else { const ok = await subscribeToPush(); setPushEnabled(ok); }
  };

  const fetchProfile = useCallback(async () => {
    try { const res = await fetch("/api/profile"); if (res.ok) { const data = await res.json(); setProfile(data); setName(data.name || ""); setEmail(data.email || ""); setPhone(data.phone || ""); } } catch {}
  }, []);
  const handleSave = async () => {
    await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone }) });
    setEditing(false); fetchProfile();
  };
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar: reader.result }) });
      fetchProfile();
    };
    reader.readAsDataURL(file);
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/settings"); if (res.ok) setSettings(await res.json()); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); fetchProfile(); fetchNotifPrefs(); isPushSubscribed().then(setPushEnabled); }, [fetchSettings, fetchProfile, fetchNotifPrefs]);

  const handleExport = async () => {
    const res = await fetch("/api/export"); const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `myplaner-export-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text(); const data = JSON.parse(text);
    const res = await fetch("/api/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await res.json(); if (result.ok) { alert(`Импортировано: ${result.imported}`); window.location.reload(); }
  };

  const initials = profile?.name?.slice(0, 1).toUpperCase() || "?";

  const Section = ({ title, icon: Icon, children }: { title: string; icon: typeof Bell; children: React.ReactNode }) => (
    <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
        <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}><Icon className="h-4 w-4" /></div>
        <h2 className="heading-md">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ padding: "32px 40px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-xl" style={{ marginBottom: 4 }}>{t("settings_title")}</h1>
          <p className="text-body">{t("settings_desc")}</p>
        </div>
        <button className="btn btn-outline" onClick={fetchSettings}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> {t("settings_refresh")}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Profile */}
        <Section title="Профиль" icon={User}>
          <div className="flex items-center gap-5" style={{ marginBottom: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {profile?.avatar ? (
                <img src={profile.avatar} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary-light)" }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "white" }}>{initials}</div>
              )}
              <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Camera className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="heading-sm">{profile?.name || user?.name}</p>
              <p className="text-xs">{profile?.role || "user"} · {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("ru-RU") : ""}</p>
            </div>
          </div>
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label className="label">Имя</label><input value={name} onChange={e => setName(e.target.value)} className="input" /></div>
              <div><label className="label">Email</label><input value={email} onChange={e => setEmail(e.target.value)} className="input" /></div>
              <div><label className="label">Телефон</label><input value={phone} onChange={e => setPhone(e.target.value)} className="input" /></div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="btn btn-primary btn-sm">Сохранить</button>
                <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">Отмена</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="btn btn-outline btn-sm">Редактировать профиль</button>
          )}
        </Section>

        {/* Theme */}
        <Section title="Тема" icon={Palette}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label">Режим</label>
              <div className="pill-nav" style={{ display: "flex" }}>
                <button onClick={() => setSchedule({ enabled: false, darkHour: 21, lightHour: 7 })} className={`pill-nav-item ${!schedule.enabled ? "pill-nav-item-active" : ""}`}>Светлая</button>
                <button onClick={() => setSchedule({ enabled: true, darkHour: 0, lightHour: 0 })} className={`pill-nav-item ${schedule.enabled && schedule.darkHour === 0 ? "pill-nav-item-active" : ""}`}>Тёмная</button>
                <button onClick={() => setSchedule({ enabled: true, darkHour: 21, lightHour: 7 })} className={`pill-nav-item ${schedule.enabled ? "pill-nav-item-active" : ""}`}>Авто</button>
              </div>
            </div>
            <div>
              <label className="label">Язык</label>
              <div className="pill-nav" style={{ display: "flex" }}>
                <button onClick={() => setLang("ru")} className={`pill-nav-item ${lang === "ru" ? "pill-nav-item-active" : ""}`}>
                  <span style={{ fontSize: 16 }}>🇷🇺</span> Русский
                </button>
                <button onClick={() => setLang("en")} className={`pill-nav-item ${lang === "en" ? "pill-nav-item-active" : ""}`}>
                  <span style={{ fontSize: 16 }}>🇬🇧</span> English
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Уведомления" icon={Bell}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <label className="flex items-center justify-between cursor-pointer" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <span className="text-caption">Push-уведомления</span>
              <button type="button" onClick={handleTogglePush} className={`toggle ${pushEnabled ? "toggle-active" : ""}`} />
            </label>
            {Object.entries({ messenger: "Мессенджер", deadlines: "Дедлайны", habits: "Привычки", serverErrors: "Ошибки сервера", maintenance: "Обслуживание" }).map(([k, v], i, arr) => (
              <label key={k} className="flex items-center justify-between cursor-pointer" style={{ padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span className="text-caption">{v}</span>
                <button type="button" onClick={() => updateNotifPref(k, !(notifPrefs as any)[k])} className={`toggle ${(notifPrefs as any)[k] ? "toggle-active" : ""}`} />
              </label>
            ))}
          </div>
        </Section>

        {/* System */}
        <Section title="Система" icon={Database}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="flex items-center justify-between">
              <span className="text-caption">SMTP</span>
              <span className={`badge ${settings?.smtpConfigured ? "badge-mint" : "badge-error"}`}>
                {settings?.smtpConfigured ? <><CheckCircle className="h-3 w-3" /> Настроен</> : <><AlertCircle className="h-3 w-3" /> Не настроен</>}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption">База данных</span>
              <span className={`badge ${settings?.databaseConnected ? "badge-mint" : "badge-error"}`}>
                {settings?.databaseConnected ? <><CheckCircle className="h-3 w-3" /> Подключена</> : <><AlertCircle className="h-3 w-3" /> Ошибка</>}
              </span>
            </div>
            <div className="divider" />
            <div className="flex gap-2">
              <button onClick={handleExport} className="btn btn-outline btn-sm" style={{ flex: 1 }}><Download className="h-3.5 w-3.5" /> Экспорт</button>
              <label className="btn btn-outline btn-sm" style={{ flex: 1, cursor: "pointer" }}><Upload className="h-3.5 w-3.5" /> Импорт<input type="file" className="hidden" accept=".json" onChange={handleImport} /></label>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
