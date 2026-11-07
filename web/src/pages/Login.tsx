import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { ApiError } from "../api";
import { useAuth } from "../auth";
import { Button, Input, Label } from "../components/ui";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl">
            ⏱
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Cron Job Panel</h1>
          <p className="mt-1 text-sm text-slate-500">Админ нэвтрэлт</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <div className="mb-4">
            <Label>Нэвтрэх нэр</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="mb-4">
            <Label>Нууц үг</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-inset ring-red-500/30">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !username || !password}>
            {loading ? "Нэвтэрч байна…" : "Нэвтрэх"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Нэвтрэх мэдээлэл серверийн env-д тохируулагдсан.
        </p>
      </div>
    </div>
  );
}
