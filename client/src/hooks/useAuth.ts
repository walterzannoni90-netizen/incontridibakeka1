import { useState, useEffect, useCallback } from "react";

const ADMIN_EMAILS = ["walterzannoni90@outlook.it"];

export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  credits?: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Carica l'utente dal localStorage al mount
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("currentUser");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const isAdmin = ADMIN_EMAILS.includes(parsedUser.email);
        setUser({ ...parsedUser, is_admin: isAdmin });
        setToken(storedToken);
      } catch (e) {
        console.error("Errore parsing user:", e);
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData: User, authToken: string) => {
    const isAdmin = ADMIN_EMAILS.includes(userData.email);
    const userWithAdmin = { ...userData, is_admin: isAdmin };
    setUser(userWithAdmin);
    setToken(authToken);
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("currentUser", JSON.stringify(userWithAdmin));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
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
