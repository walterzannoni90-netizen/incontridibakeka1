import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

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

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  credits: number;
  has_paid: boolean;
  subscription_tier: string;
  ads_count: number;
  is_verified: boolean;
}

function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    is_admin: !!row.is_admin,
    credits: row.credits ?? 0,
    has_paid: !!row.has_paid,
    subscription_tier: row.subscription_tier ?? "free",
    ads_count: row.ads_count ?? 0,
    is_verified: !!row.is_verified,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, fallbackEmail = ""): Promise<User | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,name,is_admin,credits,has_paid,subscription_tier,ads_count,is_verified")
      .eq("id", userId)
      .single();
    if (error || !data) {
      if (fallbackEmail) {
        return { id: userId, email: fallbackEmail, name: fallbackEmail, is_admin: false };
      }
      return null;
    }
    return toUser(data as ProfileRow);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.user) {
        const u = await fetchProfile(data.session.user.id, data.session.user.email ?? "");
        if (!cancelled) setUser(u);
      }
      if (!cancelled) setLoading(false);
    };
    init();
    const { data: sub } = supabase?.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      const u = await fetchProfile(session.user.id, session.user.email ?? "");
      setUser(u);
    }) ?? { data: { subscription: { unsubscribe: () => {} } } };
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase non configurato");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw new Error(error?.message || "Credenziali non valide");
    }
    const u = await fetchProfile(data.user.id, data.user.email ?? "");
    if (!u) throw new Error("Profilo non trovato");
    setUser(u);
    return u;
  }, [fetchProfile]);

  const register = useCallback(async (email: string, password: string, name: string, phone?: string) => {
    if (!supabase) throw new Error("Supabase non configurato");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error || !data.user) {
      throw new Error(error?.message || "Errore registrazione");
    }
    if (data.session) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        name,
        phone: phone ?? null,
        credits: 20,
        subscription_tier: "free",
        has_paid: false,
        ads_count: 0,
        is_admin: false,
        is_verified: false,
      });
    }
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
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
