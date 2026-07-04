import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  credits?: number;
  has_paid?: boolean;
  subscription_tier?: string;
  ads_count?: number;
  is_verified?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica sessione al mount (cookie HTTP-only)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
        console.error("Auth check error:", e);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login fallito");
    }

    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, phone?: string) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, name, phone }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Registrazione fallita");
    }

    return data;
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
    login,
    register,
    logout,
    updateUser,
  };
}
