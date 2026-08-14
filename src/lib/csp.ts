// L-2: satu sumber kebenaran untuk Content-Security-Policy aplikasi.
//
// Policy ini dipancarkan per-response oleh request middleware di src/start.ts,
// bukan sebagai header statis di vercel.json. Alasannya: TanStack Start
// menyuntikkan skrip inline (scroll restoration, stream barrier, dan chunk
// hidrasi yang di-stream) yang isinya berbeda per route dan per request,
// sehingga tidak bisa di-hash di header statis. Nonce per-response adalah
// satu-satunya cara menghapus 'unsafe-inline' tanpa mematikan hidrasi.

// Origin backend produksi. Frontend dan backend berada di site Vercel yang
// berbeda (karena itu cookie sesi memakai SameSite=None), sehingga origin ini
// WAJIB ada di connect-src; tanpa itu seluruh panggilan API diblokir browser.
export const API_ORIGIN = "https://crisbro-backend.vercel.app";

export function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    // Nonce menggantikan 'unsafe-inline'. Perlu dicatat: begitu sebuah nonce
    // hadir, browser modern MENGABAIKAN 'unsafe-inline' pada direktif yang
    // sama — jadi nilai itu tidak boleh lagi muncul di sini sebagai "jaring
    // pengaman", karena justru tidak berefek dan hanya menyesatkan pembaca.
    `script-src 'self' 'nonce-${nonce}'`,
    // style-src sengaja MASIH memakai 'unsafe-inline'. Tailwind dan Radix
    // menulis style inline pada elemen saat runtime (posisi popover, tinggi
    // accordion, dsb) tanpa melewati nonce apa pun, sehingga menghapusnya akan
    // merusak tampilan. Risikonya jauh lebih kecil daripada skrip inline:
    // penyerang tidak bisa mengeksekusi kode lewat style-src.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${API_ORIGIN}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
