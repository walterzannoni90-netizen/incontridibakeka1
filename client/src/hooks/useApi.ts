import { useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function getAuthHeaders() {
  const { data } = await supabase!.auth.getSession();
  const token = data.session?.access_token;
  return {
    ...headers,
    Authorization: token ? `Bearer ${token}` : `Bearer ${SUPABASE_KEY}`,
  };
}

async function rest<T = any>(table: string, query: string = ""): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    headers: authHeaders,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${table} ${query}: ${res.status}`);
  }
  return (await res.json()) as T;
}

async function restPost(table: string, body: any, query: string = ""): Promise<any> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: "POST",
    headers: { ...authHeaders, Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${table} POST: ${res.status}`);
  }
  return res.json();
}

async function restPatch(table: string, body: any, query: string = ""): Promise<any> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: "PATCH",
    headers: { ...authHeaders, Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${table} PATCH: ${res.status}`);
  }
  return res.json();
}

async function restDelete(table: string, query: string = ""): Promise<any> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${table} DELETE: ${res.status}`);
  }
  return res.json();
}

function parseEndpoint(endpoint: string): { table: string; params: URLSearchParams } {
  const path = endpoint.replace(/^\/api\//, "");
  const parts = path.split("?");
  const segments = parts[0].split("/").filter(Boolean);
  const table = segments[0];
  const id = segments[1];
  const params = new URLSearchParams(parts[1] || "");
  if (id && table !== "ads") {
    params.set("id", `eq.${id}`);
  }
  return { table, params };
}

export function useApi() {
  const get = useCallback(async (endpoint: string) => {
    const { table, params } = parseEndpoint(endpoint);
    if (endpoint.startsWith("/api/ads/") && endpoint.includes("/report")) {
      const parts = endpoint.split("/");
      const adId = parts[3];
      return restPost("ad_reports", { ad_id: adId, reason: "" });
    }
    if (endpoint.startsWith("/api/ads/")) {
      const adId = endpoint.split("/")[3];
      if (adId) params.set("id", `eq.${adId}`);
    }
    if (!params.has("select") && table !== "ad_reports") {
      params.set("select", "*");
    }
    const rows = await rest<any[]>(table, `?${params.toString()}`);
    if (table === "ads" && endpoint.match(/^\/api\/ads\/[^/]+$/)) {
      return { ad: rows[0] };
    }
    return { ads: rows };
  }, []);

  const post = useCallback(async (endpoint: string, data: any) => {
    if (endpoint.includes("/report")) {
      const adId = endpoint.split("/")[3];
      return restPost("ad_reports", { ad_id: adId, reason: data ?? "" });
    }
    if (endpoint.startsWith("/api/ads")) {
      const { data: session } = await supabase!.auth.getSession();
      const userId = session?.session?.user.id;
      return restPost("ads", { ...data, user_id: userId });
    }
    return restPost("ads", data);
  }, []);

  const patch = useCallback(async (endpoint: string, data: any) => {
    if (endpoint.startsWith("/api/ads")) {
      const adId = endpoint.split("/")[3];
      return restPatch("ads", data, `?id=eq.${adId}`);
    }
    if (endpoint.startsWith("/api/admin")) {
      const parts = endpoint.split("/");
      const resource = parts[3];
      const id = parts[4];
      return restPatch(resource, data, `?id=eq.${id}`);
    }
    return restPatch("ads", data);
  }, []);

  const delete_ = useCallback(async (endpoint: string) => {
    const adId = endpoint.split("/")[3];
    return restDelete("ads", `?id=eq.${adId}`);
  }, []);

  const upload = useCallback(async (files: File[]) => {
    const { data: session } = await supabase!.auth.getSession();
    const token = session?.session?.access_token ?? SUPABASE_KEY;
    const results: { url: string; path: string }[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `public/${fileName}`;
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!up.ok) {
        const t = await up.text();
        throw new Error(t || `Upload failed: ${up.status}`);
      }
      const url = `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
      results.push({ url, path });
    }
    return { urls: results.map((r) => r.url) };
  }, []);

  return { get, post, patch, delete: delete_, upload };
}
