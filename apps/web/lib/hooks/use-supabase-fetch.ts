import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export function useSupabaseFetch<T>(
  fetcher: (supabase: SupabaseClient) => Promise<T>,
  initial: T
) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    fetcher(supabase).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return { data, loading, refetch };
}
