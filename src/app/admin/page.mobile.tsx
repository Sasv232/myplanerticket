"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, User, RefreshCw, Mail } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  createdAt: string;
  taskCount: number;
}

export function AdminPageMobile() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    users: users.filter((u) => u.role === "user").length,
    totalTasks: users.reduce((sum, u) => sum + u.taskCount, 0),
  };

  return (
    <div className="space-y-5">
      <div className="mobile-page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Админ-панель</h1>
            <p className="text-sm text-[var(--secondary)]">{stats.total} пользователей</p>
          </div>
          <button onClick={fetchUsers} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)]">
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <Card className="mobile-widget-card border-red-500/30">
          <CardContent className="p-4 text-sm text-red-500">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="mobile-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <Users className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-[var(--secondary)]">Всего</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mobile-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--error)]/10">
                <Shield className="h-5 w-5 text-[var(--error)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-xs text-[var(--secondary)]">Админы</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mobile-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success)]/10">
                <User className="h-5 w-5 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.users}</p>
                <p className="text-xs text-[var(--secondary)]">Юзеры</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mobile-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--warning)]/10">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
                <p className="text-xs text-[var(--secondary)]">Задач</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-base font-semibold mb-3">Пользователи</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="mobile-task-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <div className="flex items-center gap-1 text-xs text-[var(--secondary)]">
                        <Mail className="h-3 w-3" />
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
