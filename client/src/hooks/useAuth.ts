import { useState, useEffect, useCallback } from "react";

const AUTH_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  credits?: number;
  role?: string;
  has_paid?: boolean;
}

function isAdminUser(user: any): boolean {
  return user?.role === "admin" || user?.is_admin === true;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("currentUser");
    const storedSession = localStorage.getItem("authSession");

    if (storedToken && storedUser) {
      try {
        const session = storedSession ? JSON.parse(storedSession) : null;
        if (session?.expiresAt && Date.now() > session.expiresAt) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("authSession");
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        const admin = isAdminUser(parsedUser);
        setUser({ ...parsedUser, is_admin: admin });
        setToken(storedToken);
      } catch (e) {
        console.error("Errore parsing user:", e);
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("authSession");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData: User, authToken: string) => {
    const admin = isAdminUser(userData);
    const userWithAdmin = { ...userData, is_admin: admin };
    setUser(userWithAdmin);
    setToken(authToken);
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("currentUser", JSON.stringify(userWithAdmin));
    localStorage.setItem(
      "authSession",
      JSON.stringify({
        savedAt: Date.now(),
        expiresAt: Date.now() + AUTH_SESSION_TTL_MS,
      })
    );
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authSession");
  }, []);

  return {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
    login,
    logout,
  };
}
