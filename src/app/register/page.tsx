"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserPlus, Zap, User, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const err = await register(name, password, email || undefined);
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

        <div className="form-title">Регистрация</div>
        <div className="form-subtitle">Создайте новый аккаунт</div>

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
            <label className="neu-form-label">Email <span className="text-[var(--text-muted)] font-normal">(необязательно)</span></label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                className="neu-form-input"
                style={{ paddingLeft: 42 }}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            </div>
          </div>

          <div className="neu-form-group">
            <label className="neu-form-label">Пароль</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                className="neu-form-input"
                style={{ paddingLeft: 42 }}
                placeholder="Минимум 4 символа"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
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
                Создание...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                Зарегистрироваться
              </span>
            )}
          </button>
        </form>

        <a href="/login" className="neu-form-link" style={{ textAlign: "center", display: "block" }}>
          Уже есть аккаунт? Войти
        </a>
      </div>
    </div>
  );
}
