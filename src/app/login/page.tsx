"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LogIn, Zap, User, Lock } from "lucide-react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const err = await login(name, password);
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] blob-bg relative overflow-hidden">
      <div className="neu-form-card animate-in" style={{ maxWidth: 380, width: "100%", margin: "0 16px" }}>
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-green)", boxShadow: "0 4px 15px rgba(34,197,94,0.3)" }}>
            <Zap className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="form-title">Вход</div>
        <div className="form-subtitle">Войдите в свой аккаунт</div>

        {error && (
          <div className="w-full rounded-xl p-3 mb-4 text-center text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "var(--error)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          <div className="neu-form-group">
            <label className="neu-form-label">Имя пользователя</label>
            <div style={{ position: "relative" }}>
              <input
                className="neu-form-input"
                style={{ paddingLeft: 42 }}
                placeholder="Введите имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            </div>
          </div>

          <div className="neu-form-group">
            <label className="neu-form-label">Пароль</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                className="neu-form-input"
                style={{ paddingLeft: 42 }}
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            </div>
          </div>

          <button type="submit" className="neu-form-btn" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Вход...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                Войти
              </span>
            )}
          </button>
        </form>

        <a href="/register" className="neu-form-link" style={{ textAlign: "center", display: "block" }}>
          Нет аккаунта? Зарегистрироваться
        </a>
      </div>
    </div>
  );
}
