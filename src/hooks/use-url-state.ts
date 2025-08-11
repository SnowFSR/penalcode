// hooks/use-url-state.ts
import * as React from "react";
import { useSearchParams } from "react-router-dom";

/** React Router version of "nuqs": read/write URL search params */
export function useUrlState<T extends Record<string, string | undefined>>(
  initial: T,
  opts?: { replace?: boolean }
): [T, (next: Partial<T>) => void] {
  const [sp, setSp] = useSearchParams();

  const state = React.useMemo(() => {
    const s = { ...initial };
    for (const k of Object.keys(initial)) {
      const v = sp.get(k);
      if (v !== null) (s as any)[k] = v;
    }
    return s as T;
  }, [sp, initial]);

  const setState = (next: Partial<T>) => {
    const copy = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === "") copy.delete(k);
      else copy.set(k, String(v));
    }
    setSp(copy, { replace: opts?.replace ?? true });
  };

  return [state, setState];
}
