"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, User, RefreshCw, Mail } from "lucide-react";
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

export function AdminPageDesktop() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionUser, setActionUser] = useState<string | null>(null);

  const handleMakeAdmin = async (userId: string) => {
    setActionUser(null);
  };
  const handleBan = async (userId: string) => {
    setActionUser(null);
  };

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
    <>
      <Header
        title="Админ-панель"
        description={`Пользователей: ${stats.total}`}
        actions={
          <button onClick={fetchUsers} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface)]">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </button>
        }
      />
      <main className="p-6">
        {error && (
          <Card className="mb-4 border-red-500/30">
            <CardContent className="p-4 text-sm text-red-500">{error}</CardContent>
          </Card>
        )}

        <div className="mb-6 grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Всего
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" /> Админы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Пользователи
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Задач всего</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTasks}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Имя</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Роль</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Задач</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Регистрация</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--border)]"
                      style={{ transition: "background 0.15s ease" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(63,63,70,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {u.avatar ? (
                            <UserAvatar src={u.avatar} name={u.name} size="sm" />
                          ) : (
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
                            }}>
                              {u.name?.[0] || "?"}
                            </div>
                          )}
                          {u.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {u.email || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.role === "admin" ? (
                          <Badge variant="destructive">
                            {u.role}
                          </Badge>
                        ) : (
                          <span style={{
                            display: "inline-flex", alignItems: "center", padding: "2px 10px",
                            borderRadius: 999, fontSize: 12, fontWeight: 500,
                            background: "#27272a", color: "#a1a1aa",
                          }}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{u.taskCount}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActionUser(actionUser === u.id ? null : u.id); }}
                          className="btn-icon btn-icon-sm"
                          style={{ fontSize: 16, letterSpacing: 2 }}
                        >···</button>
                        {actionUser === u.id && (
                          <div style={{ position: "absolute", right: 16, top: "100%", zIndex: 50, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                            {u.role !== "admin" && <button onClick={() => handleMakeAdmin(u.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, borderRadius: 6, border: "none", background: "none", color: "var(--text)", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-alt)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>Сделать админом</button>}
                            <button onClick={() => handleBan(u.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, borderRadius: 6, border: "none", background: "none", color: "var(--error)", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-alt)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>Забанить</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
