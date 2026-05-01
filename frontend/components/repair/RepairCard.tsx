"use client";

import { motion } from "framer-motion";
import { Wrench, Clock } from "lucide-react";
import type { Repair } from "@/lib/types";
import { PrioridadBadge } from "./PrioridadBadge";

function timeAgo(iso: string | undefined) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "ahora";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export function RepairCard({
  repair,
  onClick,
}: {
  repair: Repair;
  onClick?: () => void;
}) {
  const motorName =
    typeof repair.assetId === "object" && repair.assetId
      ? repair.assetId.nombre
      : "Motor desconocido";
  const motorMeta =
    typeof repair.assetId === "object" && repair.assetId
      ? [repair.assetId.cliente, repair.assetId.sector].filter(Boolean).join(" · ")
      : "";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className="block w-full rounded-xl border border-border bg-bg/40 p-3 text-left transition-colors hover:border-border-strong hover:bg-elev/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-text-dim">
            <Wrench size={10} />
            #{repair._id.slice(-5)}
          </div>
          <div className="mt-1 truncate text-[13px] font-medium text-text">{motorName}</div>
          {motorMeta && (
            <div className="truncate text-[10px] text-text-dim">{motorMeta}</div>
          )}
        </div>
        <PrioridadBadge prioridad={repair.prioridad} />
      </div>

      {repair.descripcion && (
        <div className="mt-2.5 line-clamp-2 text-[12px] text-text-muted">
          {repair.descripcion}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
        <span className="font-mono text-[10px] text-text-dim">{repair.tecnico}</span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-text-dim">
          <Clock size={10} />
          {timeAgo(repair.fechaInicio)}
        </span>
      </div>
    </motion.button>
  );
}
