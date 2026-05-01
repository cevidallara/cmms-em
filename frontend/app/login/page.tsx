"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { AuthBackground } from "@/components/AuthBackground";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Error al iniciar sesión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <AuthBackground />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Logo size={28} className="justify-center text-lg" />
          <p className="mt-3 text-[13px] text-text-muted">
            Cada motor de tu planta, bajo control.
          </p>
        </div>

        <Card elevated className="p-8">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold tracking-tight text-text">
              Inicia sesión
            </h1>
            <p className="mt-1 text-[13px] text-text-muted">
              Accede al panel de tu flota.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="tu@empresa.cl"
            />
            <Field
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />

            <Button type="submit" loading={loading} fullWidth size="lg">
              {loading ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[13px] text-text-muted">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-volt hover:underline">
              Registra tu organización
            </Link>
          </p>
        </Card>

        <p className="mt-6 text-center text-[11px] text-text-dim">
          © {new Date().getFullYear()} Nikolator
        </p>
      </div>
    </div>
  );
}
