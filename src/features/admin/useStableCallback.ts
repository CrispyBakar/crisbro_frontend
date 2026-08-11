import { useCallback, useRef } from "react";

// L-7: Menambahkan hook dengan referensi handler yang stabil agar komponen tabel memo dapat mencegah re-render tanpa kehilangan state terbaru.
export function useStableCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
): (...args: Args) => Result {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args: Args) => callbackRef.current(...args), []);
}
