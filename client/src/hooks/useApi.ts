import { useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export function useApi() {
  const get = useCallback(async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `GET ${endpoint}: ${response.status}`);
    }
    return response.json();
  }, []);

  const post = useCallback(async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `POST ${endpoint}: ${response.status}`);
    }
    return response.json();
  }, []);

  const patch = useCallback(async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `PATCH ${endpoint}: ${response.status}`);
    }
    return response.json();
  }, []);

  const delete_ = useCallback(async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `DELETE ${endpoint}: ${response.status}`);
    }
    return response.json();
  }, []);

  const upload = useCallback(async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));

    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Upload failed: ${response.status}`);
    }
    return response.json();
  }, []);

  return { get, post, patch, delete: delete_, upload };
}
