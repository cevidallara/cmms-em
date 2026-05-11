"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

let inflight: Promise<string | null> | null = null;

/**
 * Refresca el access token usando el refresh token de localStorage.
 * Coalesce calls concurrentes en una sola request.
 * Si el refresh falla, limpia storage y redirige a /login.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (inflight) return inflight;

  inflight = (async () => {
    if (typeof window === "undefined") return null;
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      localStorage.clear();
      window.location.href = "/login";
      return null;
    }

    try {
      const res = await fetch(`${API_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        localStorage.clear();
        window.location.href = "/login";
        return null;
      }
      const data = await res.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}
