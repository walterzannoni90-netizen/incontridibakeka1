import { useLocation } from "wouter";
import { useCallback } from "react";

export function useRouter() {
  const [location, setLocation] = useLocation();

  const navigate = useCallback(
    (path: string) => {
      setLocation(path);
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
    currentPath: location,
  };
}
