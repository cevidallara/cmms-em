"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Wrench, AlertCircle } from "lucide-react";
import { streamChat, type ChatMessage, type ToolCall } from "@/lib/aiStream";

type Turn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolCalls?: ToolCall[];
  error?: string;
  pending?: boolean;
};

const STORAGE_KEY = "nikolator.chat.open";
const SUGGESTIONS = [
  "¿Cuántos motores tengo en total?",
  "Dame un resumen de mi flota",
  "¿Qué reparaciones tengo abiertas?",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<{ abort: () => void } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist open state
  useEffect(() => {
    if (typeof window === "undefined") return;
    setOpen(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  }, [open]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  // Cleanup on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userTurn: Turn = { id: uid(), role: "user", text: trimmed };
    const assistantId = uid();
    const assistantTurn: Turn = { id: assistantId, role: "assistant", text: "", toolCalls: [], pending: true };
    const next = [...turns, userTurn, assistantTurn];
    setTurns(next);
    setInput("");
    setStreaming(true);

    const history: ChatMessage[] = next
      .filter(t => !t.pending)
      .map(t => ({ role: t.role, content: t.text }));

    abortRef.current = streamChat(history, {
      onToken: (delta) => {
        setTurns(prev => prev.map(t => t.id === assistantId ? { ...t, text: t.text + delta } : t));
      },
      onToolCall: (call) => {
        setTurns(prev => prev.map(t => t.id === assistantId
          ? { ...t, toolCalls: [...(t.toolCalls || []), call] }
          : t));
      },
      onToolResult: (id, summary) => {
        setTurns(prev => prev.map(t => t.id === assistantId
          ? { ...t, toolCalls: (t.toolCalls || []).map(c => c.id === id ? { ...c, resultSummary: summary } : c) }
          : t));
      },
      onDone: () => {
        setTurns(prev => prev.map(t => t.id === assistantId ? { ...t, pending: false } : t));
        setStreaming(false);
      },
      onError: (msg) => {
        setTurns(prev => prev.map(t => t.id === assistantId
          ? { ...t, pending: false, error: msg }
          : t));
        setStreaming(false);
      },
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setTurns([]);
    setStreaming(false);
  }

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-volt text-bg shadow-[0_10px_30px_-10px_rgba(181,245,0,0.5)] transition-transform hover:-translate-y-0.5"
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
      >
        {open ? <X size={18} /> : <Sparkles size={18} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed right-0 top-0 z-30 flex h-full w-full max-w-md flex-col border-l border-border bg-elev/95 backdrop-blur-xl"
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-volt" />
                <h2 className="text-[14px] font-medium">Asistente Nikolator</h2>
              </div>
              <div className="flex items-center gap-2">
                {turns.length > 0 && (
                  <button
                    type="button"
                    onClick={reset}
                    className="text-[11px] text-text-dim transition-colors hover:text-text"
                  >
                    Nueva conversación
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-md text-text-muted transition-colors hover:bg-elev-2 hover:text-text"
                  aria-label="Cerrar"
                >
                  <X size={14} />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              {turns.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-[13px] text-text-muted">
                    Pregúntame por tu flota, lecturas, reparaciones o eficiencia. Consulto tus datos en tiempo real.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-lg border border-border bg-bg/40 px-3 py-2 text-left text-[12.5px] text-text-muted transition-colors hover:border-border-strong hover:bg-elev-2 hover:text-text"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {turns.map((t) => <TurnBubble key={t.id} turn={t} />)}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-border p-3">
              <div className="flex items-end gap-2 rounded-xl border border-border bg-bg/60 px-3 py-2 focus-within:border-border-strong">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Pregunta sobre tu flota..."
                  disabled={streaming}
                  className="min-h-[20px] max-h-32 flex-1 resize-none bg-transparent text-[13px] text-text placeholder:text-text-dim focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  className="grid h-8 w-8 place-items-center rounded-lg bg-volt text-bg transition-opacity disabled:opacity-40"
                  aria-label="Enviar"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="mt-1.5 px-1 text-[10.5px] text-text-dim">Enter envía · Shift+Enter para salto de línea</p>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function TurnBubble({ turn }: { turn: Turn }) {
  if (turn.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-volt px-3 py-2 text-[13px] text-bg">
          {turn.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {turn.toolCalls?.map((c) => <ToolCallChip key={c.id} call={c} />)}
      {turn.text && (
        <div className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-bg/40 px-3 py-2 text-[13px] leading-relaxed text-text">
          {turn.text}
          {turn.pending && <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-volt align-middle" />}
        </div>
      )}
      {turn.error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{turn.error}</span>
        </div>
      )}
    </div>
  );
}

function ToolCallChip({ call }: { call: ToolCall }) {
  const done = call.resultSummary !== undefined;
  const error = (call.resultSummary as { error?: string } | null)?.error;
  const summary = formatSummary(call);
  return (
    <div className={`inline-flex items-center gap-2 self-start rounded-full border px-2.5 py-1 text-[11px] ${
      error ? "border-danger/40 bg-danger/10 text-danger"
            : done ? "border-border bg-bg/60 text-text-muted"
            : "border-spark/40 bg-spark/10 text-spark"
    }`}>
      <Wrench size={11} className={done ? "" : "animate-pulse"} />
      <span className="font-mono">{call.name}</span>
      {summary && <span className="text-text-dim">· {summary}</span>}
    </div>
  );
}

function formatSummary(call: ToolCall): string | null {
  if (!call.resultSummary) return null;
  const r = call.resultSummary as Record<string, unknown>;
  if (r.error) return String(r.error);
  const parts: string[] = [];
  if (typeof r.totalMotores === "number") parts.push(`${r.totalMotores} motores`);
  if (typeof r.count === "number") parts.push(`${r.count} resultados`);
  if (r.motor) parts.push(String(r.motor));
  if (typeof r.lecturas === "number") parts.push(`${r.lecturas} lecturas`);
  if (r.rangoDias) parts.push(`${r.rangoDias}d`);
  return parts.join(" · ") || null;
}
