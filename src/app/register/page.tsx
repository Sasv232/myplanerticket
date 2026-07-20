"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Регистрация</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <p className="rounded-lg bg-[var(--error)]/10 p-2 text-center text-sm text-[var(--error)]">{error}</p>
            )}
            <Input placeholder="Имя пользователя" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input type="email" placeholder="Email (необязательно)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" placeholder="Пароль (мин. 4 символа)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} />
            <Button type="submit" className="w-full" disabled={loading}>
              <UserPlus className="h-4 w-4" />
              {loading ? "Создание..." : "Зарегистрироваться"}
            </Button>
            <p className="text-center text-sm text-[var(--secondary)]">
              Уже есть аккаунт?{" "}
              <a href="/login" className="text-[var(--accent)] hover:underline">
                Войти
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
