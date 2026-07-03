import { useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function getHeaders(token?: string) {
  return {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export function useSupabase() {
  const get = useCallback(async (table: string, query: string, token?: string) => {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${query}`,
      {
        headers: getHeaders(token),
      }
    );
    if (!response.ok) throw new Error(`GET ${table}: ${response.status}`);
    return response.json();
  }, []);

  const post = useCallback(
    async (table: string, data: any, token?: string) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { ...getHeaders(token), Prefer: "return=representation" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`POST ${table}: ${response.status}`);
      return response.json();
    },
    []
  );

  const patch = useCallback(
    async (table: string, data: any, match: Record<string, any>, token?: string) => {
      const query = Object.entries(match)
        .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
        .join("&");
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?${query}`,
        {
          method: "PATCH",
          headers: { ...getHeaders(token), Prefer: "return=representation" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error(`PATCH ${table}: ${response.status}`);
      return response.json();
    },
    []
  );

  const delete_ = useCallback(
    async (table: string, match: Record<string, any>, token?: string) => {
      const query = Object.entries(match)
        .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
        .join("&");
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?${query}`,
        {
          method: "DELETE",
          headers: getHeaders(token),
        }
      );
      if (!response.ok) throw new Error(`DELETE ${table}: ${response.status}`);
      return response.json();
    },
    []
  );

  return { get, post, patch, delete: delete_ };
}
