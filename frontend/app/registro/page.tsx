"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { AuthBackground } from "@/components/AuthBackground";

type FormState = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword: string;
  orgNombre: string;
  orgTipo: "empresa" | "centro";
};

const initialForm: FormState = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  confirmPassword: "",
  orgNombre: "",
  orgTipo: "empresa",
};

export default function RegistroPage() {
  const router = useRouter();
  const { registro } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword)
      return setError("Las contraseñas no coinciden");
    if (form.password.length < 8)
      return setError("La contraseña debe tener al menos 8 caracteres");

    setLoading(true);
    try {
      await registro({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
        organizacion: { nombre: form.orgNombre, tipo: form.orgTipo },
      });
      router.push("/");
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Error al registrar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <AuthBackground />

      <div className="relative w-full max-w-[520px]">
        <div className="mb-8 text-center">
          <Logo size={28} className="justify-center text-lg" />
          <p className="mt-3 text-[13px] text-text-muted">
            Crea tu cuenta y empieza a ver lo invisible.
          </p>
        </div>

        <Card elevated className="p-8">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold tracking-tight text-text">
              Crear cuenta
            </h1>
            <p className="mt-1 text-[13px] text-text-muted">
              Registra tu organización en Nikolator.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
                Datos personales
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Nombre"
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  required
                  autoComplete="given-name"
                />
                <Field
                  label="Apellido"
                  value={form.apellido}
                  onChange={(e) => set("apellido", e.target.value)}
                  autoComplete="family-name"
                />
              </div>
              <div className="mt-3">
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="tu@empresa.cl"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field
                  label="Contraseña"
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  autoComplete="new-password"
                  hint="Mínimo 8 caracteres"
                />
                <Field
                  label="Confirmar"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
                Organización
              </div>
              <div className="grid grid-cols-[1fr_180px] gap-3">
                <Field
                  label="Nombre de la organización"
                  value={form.orgNombre}
                  onChange={(e) => set("orgNombre", e.target.value)}
                  required
                />
                <SelectField
                  label="Tipo"
                  value={form.orgTipo}
                  onChange={(e) =>
                    set("orgTipo", e.target.value as FormState["orgTipo"])
                  }
                  options={[
                    { value: "empresa", label: "Empresa" },
                    { value: "centro", label: "Centro de servicio" },
                  ]}
                />
              </div>
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg">
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[13px] text-text-muted">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-volt hover:underline">
              Inicia sesión
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
