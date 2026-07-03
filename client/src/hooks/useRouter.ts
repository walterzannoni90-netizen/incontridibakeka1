import { useLocation } from "wouter";
import { useCallback } from "react";

// Base path: "/" su custom domain, "/nome-repo/" su GitHub Pages
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function withBase(path: string): string {
  if (!BASE || path.startsWith(BASE + "/")) return path;
  return BASE + (path.startsWith("/") ? path : "/" + path);
}

function stripBase(path: string): string {
  if (BASE && path.startsWith(BASE + "/")) {
    return path.slice(BASE.length) || "/";
  }
  return path;
}

export function useRouter() {
  const [location, setLocation] = useLocation();

  const navigate = useCallback(
    (path: string) => {
      setLocation(withBase(path));
    },
    [setLocation]
  );

  const getQueryParam = useCallback(
    (param: string): string | null => {
      const params = new URLSearchParams(window.location.search);
      return params.get(param);
    },
    []
  );

  const getAllQueryParams = useCallback((): Record<string, string> => {
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }, []);

  return {
    navigate,
    getQueryParam,
    getAllQueryParams,
    currentPath: stripBase(location),
  };
}
