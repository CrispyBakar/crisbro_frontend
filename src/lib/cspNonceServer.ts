// L-2: penyimpanan nonce per-request, khusus server.
//
// Modul ini mengimpor node:async_hooks sehingga TIDAK BOLEH diimpor dari kode
// isomorfik. Ia hanya di-import secara dinamis dari dalam handler server di
// src/start.ts, supaya tidak pernah ikut ke bundle browser.
import { AsyncLocalStorage } from "node:async_hooks";
import { CSP_NONCE_GLOBAL } from "./cspNonce";

const globalRef = globalThis as Record<string, unknown>;

// Dititipkan ke globalThis agar getCspNonce() di src/lib/cspNonce.ts bisa
// membacanya tanpa ikut menarik node:async_hooks ke bundle klien. Dibuat sekali
// per proses; invocation berikutnya memakai instance yang sama.
const storage = (globalRef[CSP_NONCE_GLOBAL] ??=
  new AsyncLocalStorage<string>()) as AsyncLocalStorage<string>;

export function createNonce(): string {
  // Web Crypto, bukan node:crypto, supaya tetap jalan bila runtime dipindah ke
  // edge/Workers. 16 byte acak = 128 bit, jauh di atas anjuran minimum CSP.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary);
}

export function runWithNonce<T>(nonce: string, fn: () => T): T {
  return storage.run(nonce, fn);
}
