import { useEffect } from "react";

const APP_NAME = "Crisbro";

/** Set judul tab browser per halaman, mis. "Dashboard • Crisbro". */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} • ${APP_NAME}` : APP_NAME;
  }, [title]);
}
