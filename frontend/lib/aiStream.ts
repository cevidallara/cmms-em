"use client";

import { getAccessToken, refreshAccessToken } from "./authToken";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
  resultSummary?: Record<string, unknown> | null;
};

export type StreamHandlers = {
  onToken?: (text: string) => void;
  onToolCall?: (call: ToolCall) => void;
  onToolResult?: (id: string, summary: Record<string, unknown> | null) => void;
  onTurnDone?: (info: { stopReason: string; usage: Record<string, number> }) => void;
  onDone?: (info: { totalUsage: Record<string, number>; latencyMs: number; turns: number }) => void;
  onError?: (msg: string) => void;
};

/**
 * POST /api/ai/chat con streaming SSE manual (fetch + ReadableStream).
 * Devuelve una función abort() para cancelar.
 */
async function postChat(
  messages: ChatMessage[],
  model: string | undefined,
  token: string | null,
  signal: AbortSignal
) {
  return fetch(`${API_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || ""}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ messages, model }),
    signal,
  });
}

export function streamChat(
  messages: ChatMessage[],
  handlers: StreamHandlers,
  opts: { model?: string } = {}
): { abort: () => void } {
  const controller = new AbortController();

  (async () => {
    try {
      let token = getAccessToken();
      let res = await postChat(messages, opts.model, token, controller.signal);

      // Auto-refresh on 401 (JWT expired) — replicate axios interceptor behavior
      if (res.status === 401) {
        const fresh = await refreshAccessToken();
        if (!fresh) {
          handlers.onError?.("Sesión expirada");
          return;
        }
        token = fresh;
        res = await postChat(messages, opts.model, token, controller.signal);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let msg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text);
          if (j.error) msg = j.error;
        } catch { /* keep default */ }
        handlers.onError?.(msg);
        return;
      }

      if (!res.body) {
        handlers.onError?.("Respuesta sin body");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE: eventos separados por doble newline
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (!raw.trim() || raw.startsWith(":")) continue; // heartbeat o vacío

          let eventName = "message";
          const dataLines: string[] = [];
          for (const line of raw.split("\n")) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
          }
          if (!dataLines.length) continue;
          let payload: Record<string, unknown>;
          try {
            payload = JSON.parse(dataLines.join("\n"));
          } catch {
            continue;
          }

          switch (eventName) {
            case "token":
              if (typeof payload.text === "string") handlers.onToken?.(payload.text);
              break;
            case "tool_call":
              handlers.onToolCall?.({
                id: String(payload.id),
                name: String(payload.name),
                input: (payload.input as Record<string, unknown>) || {},
              });
              break;
            case "tool_result":
              handlers.onToolResult?.(
                String(payload.id),
                (payload.summary as Record<string, unknown> | null) ?? null
              );
              break;
            case "turn_done":
              handlers.onTurnDone?.({
                stopReason: String(payload.stopReason),
                usage: (payload.usage as Record<string, number>) || {},
              });
              break;
            case "done":
              handlers.onDone?.({
                totalUsage: (payload.totalUsage as Record<string, number>) || {},
                latencyMs: Number(payload.latencyMs) || 0,
                turns: Number(payload.turns) || 0,
              });
              break;
            case "error":
              handlers.onError?.(String(payload.error || "Error desconocido"));
              break;
            // 'connected' ignored
          }
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      handlers.onError?.((err as Error).message || "Error de red");
    }
  })();

  return { abort: () => controller.abort() };
}
