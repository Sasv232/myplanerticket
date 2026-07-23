"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, User, RefreshCw, Mail, Home } from "lucide-react";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { UserAvatar } from "@/components/ui/user-avatar";

interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
  taskCount: number;
}

export function AdminPageMobile() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { setOpen } = useMobileSidebar();

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
      } else {
        setUsers(data.users);
      }
    } catch {
      setError("Ошибка сети");
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    users: users.filter((u) => u.role === "user").length,
    totalTasks: users.reduce((sum, u) => sum + u.taskCount, 0),
  };

  return (
    <div className="mobile-main">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="h-9 w-9 rounded-xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150 shrink-0"
        >
          <span className="text-xs font-bold text-[var(--accent)]">M</span>
        </button>
        <Link href="/" className="h-9 w-9 rounded-xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150 shrink-0">
          <Home className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate">Админ-панель</h1>
          <p className="text-[11px] text-[var(--secondary)]">{stats.total} пользователей</p>
        </div>
        <button onClick={fetchUsers} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)] active:scale-95 transition-all duration-150 shrink-0">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {error && (
          <div className="mobile-section border-[var(--error)]/30 p-4">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="mobile-section p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                <Users className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-[var(--secondary)]">Всего</p>
              </div>
            </div>
          </div>
          <div className="mobile-section p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--error)]/10">
                <Shield className="h-6 w-6 text-[var(--error)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-xs text-[var(--secondary)]">Админы</p>
              </div>
            </div>
          </div>
          <div className="mobile-section p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--success)]/10">
                <User className="h-6 w-6 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.users}</p>
                <p className="text-xs text-[var(--secondary)]">Юзеры</p>
              </div>
            </div>
          </div>
          <div className="mobile-section p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--warning)]/10">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
                <p className="text-xs text-[var(--secondary)]">Задач</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users list */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Пользователи</h2>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="mobile-section p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <UserAvatar src={u.avatar} name={u.name} size="lg" />
                    <div>
                      <p className="text-base font-semibold">{u.name}</p>
                      <div className="flex items-center gap-1.5 text-sm text-[var(--secondary)] mt-0.5">
                        <Mail className="h-3.5 w-3.5" />
                        {u.email || "нет email"}
                      </div>
                    </div>
                  </div>
                  <Badge variant={u.role === "admin" ? "destructive" : "default"}>
                    {u.role}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--secondary)]">
                  <span>{u.taskCount} задач</span>
                  <span>{new Date(u.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
