"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

type LiveValue = {
  connected: boolean;
  lastEventAt: number | null;
};

const LiveContext = createContext<LiveValue>({ connected: false, lastEventAt: null });

export function LiveProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!usuario) return;
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const url = `${API_URL}/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
    });

    es.addEventListener("reading.created", () => {
      setLastEventAt(Date.now());
      queryClient.invalidateQueries({ queryKey: ["readings"] });
      queryClient.invalidateQueries({ queryKey: ["sensors"] });
      queryClient.invalidateQueries({ queryKey: ["motors"] });
    });

    es.onopen = () => setConnected(true);
    es.onerror = () => {
      // EventSource auto-reconnects; reflejamos en UI
      setConnected(false);
    };

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [usuario, queryClient]);

  return (
    <LiveContext.Provider value={{ connected, lastEventAt }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  return useContext(LiveContext);
}
