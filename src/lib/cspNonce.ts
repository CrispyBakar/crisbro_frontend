// L-2: pembaca nonce yang aman dipanggil dari kode isomorfik.
//
// src/router.tsx dieksekusi di server DAN di browser, jadi modul ini tidak
// boleh mengimpor apa pun dari node:. Penyimpanan nonce yang sebenarnya
// (AsyncLocalStorage) dipasang server-side oleh src/lib/cspNonceServer.ts dan
// dititipkan ke globalThis dengan kunci di bawah ini. Di browser kunci itu
// tidak pernah ada, sehingga getCspNonce() mengembalikan undefined dan router
// berjalan tanpa nonce persis seperti sebelumnya.
export const CSP_NONCE_GLOBAL = "__crisbroCspNonceStore__";

type NonceStore = { getStore: () => string | undefined };

export function getCspNonce(): string | undefined {
  const store = (globalThis as Record<string, unknown>)[CSP_NONCE_GLOBAL] as
    | NonceStore
    | undefined;

  return typeof store?.getStore === "function" ? store.getStore() : undefined;
}
