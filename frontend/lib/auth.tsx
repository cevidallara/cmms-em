"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api from "./api";

export type Usuario = {
  _id: string;
  nombre: string;
  apellido?: string;
  email: string;
  rol: string;
  organizacionId: string | null;
  organizacion?: { _id: string; nombre: string; tipo: string } | null;
};

export type RegistroPayload = {
  nombre: string;
  apellido?: string;
  email: string;
  password: string;
  organizacion: { nombre: string; tipo: "empresa" | "centro" };
};

type AuthValue = {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  registro: (payload: RegistroPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarUsuario = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setCargando(false);
      return;
    }
    try {
      const { data } = await api.get<Usuario>("/auth/me");
      setUsuario(data);
    } catch {
      localStorage.clear();
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuario();
  }, [cargarUsuario]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUsuario(data.usuario);
  };

  const registro = async (payload: RegistroPayload) => {
    const { data } = await api.post("/auth/registro", payload);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUsuario(data.usuario);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // backend logout puede fallar — el cliente igual cierra sesión
    }
    localStorage.clear();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
