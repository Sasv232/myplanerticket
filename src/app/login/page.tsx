"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Вход</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <p className="rounded-lg bg-[var(--error)]/10 p-2 text-center text-sm text-[var(--error)]">{error}</p>
            )}
            <Input placeholder="Имя пользователя" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? "Вход..." : "Войти"}
            </Button>
            <p className="text-center text-sm text-[var(--secondary)]">
              Нет аккаунта?{" "}
              <a href="/register" className="text-[var(--accent)] hover:underline">
                Зарегистрироваться
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
