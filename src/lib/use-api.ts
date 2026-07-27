"use client";
import * as React from "react";
import { apiGet, ApiError } from "./api";

export function useApi<T>(path: string | null) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [loading, setLoading] = React.useState(Boolean(path));

  const load = React.useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<T>(path));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err
          : new ApiError("REQUEST_FAILED", "Failed to load.", 0),
      );
    } finally {
      setLoading(false);
    }
  }, [path]);

  React.useEffect(() => {
    // Fetch on mount / when the path changes (external data sync).
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}
