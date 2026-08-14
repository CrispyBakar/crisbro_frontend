import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";
import { buildContentSecurityPolicy } from "./lib/csp";

// L-2: memasang Content-Security-Policy ber-nonce pada setiap response HTML.
//
// Nonce dibuat per request, dititipkan ke AsyncLocalStorage selama next()
// berjalan, lalu dibaca src/router.tsx saat membangun router. TanStack
// meneruskan nilai itu ke SELURUH skrip inline yang dipancarkannya — scroll
// restoration (ScriptOnce), manifest & stream barrier (Scripts), dan chunk
// hidrasi yang di-stream (ssr-server) — sehingga tidak ada satu pun skrip
// framework yang tertinggal tanpa nonce.
const contentSecurityPolicyMiddleware = createMiddleware({
  type: "request",
}).server(async ({ next, handlerType }) => {
  // Hanya response dokumen yang perlu CSP. Panggilan server function
  // mengembalikan data, bukan HTML yang bisa mengeksekusi skrip.
  if (handlerType !== "router") return next();

  const { createNonce, runWithNonce } = await import("./lib/cspNonceServer");
  const nonce = createNonce();
  const result = await runWithNonce(nonce, () => next());
  const policy = buildContentSecurityPolicy(nonce);

  try {
    result.response.headers.set("Content-Security-Policy", policy);
    return result;
  } catch {
    // Sebagian runtime menandai headers response sebagai immutable. Menyusun
    // ulang Response mempertahankan body streaming apa adanya, jadi halaman
    // tetap terkirim bertahap seperti sebelumnya.
    const headers = new Headers(result.response.headers);
    headers.set("Content-Security-Policy", policy);

    return {
      ...result,
      response: new Response(result.response.body, {
        status: result.response.status,
        statusText: result.response.statusText,
        headers,
      }),
    };
  }
});

// PENTING: begitu aplikasi punya start instance, TanStack berhenti memasang
// CSRF middleware bawaannya secara otomatis (lihat createStartHandler:
// `hasStartInstance ? startOptions.requestMiddleware : [defaultCsrfMiddleware]`).
// Middleware di bawah ini mengembalikan proteksi tersebut dengan filter yang
// sama seperti default framework, supaya menambah CSP tidak diam-diam
// mencabut pertahanan lain.
export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" }),
    contentSecurityPolicyMiddleware,
  ],
}));
