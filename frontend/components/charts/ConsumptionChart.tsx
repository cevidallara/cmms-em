"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { Reading } from "@/lib/types";

type Props = {
  readings: Reading[];
  height?: number;
};

export function ConsumptionChart({ readings, height = 200 }: Props) {
  const data = useMemo(() => {
    return [...readings]
      .filter((r) => r.consumoEnergia != null && !Number.isNaN(r.consumoEnergia))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map((r) => ({
        x: new Date(r.fecha).getTime(),
        y: r.consumoEnergia ?? 0,
      }));
  }, [readings]);

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-border bg-bg/40 text-[12px] text-text-dim"
        style={{ height }}
      >
        Se necesitan al menos 2 lecturas para graficar el consumo
      </div>
    );
  }

  const W = 800;
  const H = height;
  const PAD = { top: 16, right: 16, bottom: 24, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys, 0);
  const yMax = Math.max(...ys, 1);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const px = (x: number) => PAD.left + ((x - xMin) / xRange) * innerW;
  const py = (y: number) => PAD.top + (1 - (y - yMin) / yRange) * innerH;

  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${px(d.x).toFixed(1)} ${py(d.y).toFixed(1)}`)
    .join(" ");
  const fillPath = `${path} L ${px(xMax).toFixed(1)} ${PAD.top + innerH} L ${px(xMin).toFixed(1)} ${PAD.top + innerH} Z`;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => yMin + (yRange * i) / yTicks);

  const lastPt = data[data.length - 1];
  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="cc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B5F500" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#B5F500" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cc-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B5F500" />
          <stop offset="60%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {yLabels.map((label, i) => {
        const y = py(label);
        return (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="3 4"
            />
            <text
              x={PAD.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
              fill="rgba(236,239,247,0.4)"
            >
              {label.toFixed(0)}
            </text>
          </g>
        );
      })}

      <text
        x={PAD.left}
        y={H - 4}
        fontSize="9"
        fontFamily="ui-monospace, monospace"
        fill="rgba(236,239,247,0.4)"
      >
        {formatDate(xMin)}
      </text>
      <text
        x={W - PAD.right}
        y={H - 4}
        textAnchor="end"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
        fill="rgba(236,239,247,0.4)"
      >
        {formatDate(xMax)}
      </text>

      <motion.path
        d={fillPath}
        fill="url(#cc-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke="url(#cc-stroke)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      <motion.circle
        r="3.5"
        fill="#B5F500"
        cx={px(lastPt.x)}
        cy={py(lastPt.y)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      />
    </svg>
  );
}
