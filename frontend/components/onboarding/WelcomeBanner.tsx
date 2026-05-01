"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Boxes, GaugeCircle, LineChart, Check, ArrowRight } from "lucide-react";

type Step = {
  n: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  cta: string;
  done?: boolean;
};

type Props = {
  hasMotors?: boolean;
  hasReadings?: boolean;
};

export function WelcomeBanner({ hasMotors = false, hasReadings = false }: Props) {
  const steps: Step[] = [
    {
      n: "01",
      title: "Carga tu primer motor",
      description: "Define la flota, sus especificaciones y dónde está cada equipo.",
      icon: Boxes,
      href: "/motores/nuevo",
      cta: hasMotors ? "Listo" : "Crear motor",
      done: hasMotors,
    },
    {
      n: "02",
      title: "Registra una lectura",
      description: "Desde el detalle del motor — consumo, voltaje, eficiencia.",
      icon: GaugeCircle,
      href: hasMotors ? "/motores" : "/motores/nuevo",
      cta: hasReadings ? "Listo" : hasMotors ? "Cargar lectura" : "Crear motor primero",
      done: hasReadings,
    },
    {
      n: "03",
      title: "Explora el comparador",
      description: "Identifica candidatos a reemplazo y proyecta tu ahorro.",
      icon: LineChart,
      href: "/comparador",
      cta: "Abrir comparador",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-border-strong bg-elev/60 p-7 backdrop-blur-xl md:p-10"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full opacity-50 blur-[100px]"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.45), transparent 60%)",
          }}
        />
        <div
          className="absolute -bottom-40 right-0 h-[400px] w-[400px] rounded-full opacity-50 blur-[100px]"
          style={{
            background: "radial-gradient(circle, rgba(0,229,255,0.4), transparent 60%)",
          }}
        />
        <div className="scanline-grid absolute inset-0 opacity-25" />
      </div>

      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
        <span className="mr-2 inline-block h-1 w-1 rounded-full bg-volt align-middle" />
        Bienvenido a Nikolator
      </div>
      <h2 className="mt-3 text-[26px] font-semibold leading-[1.05] tracking-[-0.02em] text-text md:text-[32px]">
        Pongamos tu flota en línea en 3 pasos.
      </h2>
      <p className="mt-2 max-w-xl text-[14px] text-text-muted">
        Estos son los hitos para empezar a ver y ahorrar. La interfaz se va
        completando a medida que avanzas.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.45 }}
              className={`relative flex flex-col rounded-xl border p-5 ${
                s.done ? "border-success/30 bg-success/5" : "border-border bg-bg/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${s.done ? "bg-success/20 text-success" : "bg-elev-2 text-text-muted"}`}>
                  {s.done ? <Check size={14} /> : <Icon size={14} />}
                </span>
                <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${s.done ? "text-success" : "text-text-dim"}`}>
                  {s.done ? "Hecho" : s.n}
                </span>
              </div>
              <div className="mt-3 text-[14px] font-medium text-text">{s.title}</div>
              <div className="mt-1 flex-1 text-[12px] text-text-muted">{s.description}</div>
              <Link
                href={s.href}
                className={`mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors ${
                  s.done ? "text-success" : "text-volt hover:text-text"
                }`}
              >
                {s.cta}
                {!s.done && <ArrowRight size={12} />}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
