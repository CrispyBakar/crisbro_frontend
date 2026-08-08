import "@testing-library/jest-dom/vitest";

// M-12: Menambahkan polyfill pada lingkungan pengujian agar komponen Radix UI dapat berjalan di JSDOM tanpa error akibat keterbatasan API bawaan.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
// H-5: JSDOM tidak mengimplementasikan matchMedia, sedangkan komponen yang
// responsif (useIsMobile, useMediaQuery pada modul grafik) memanggilnya saat
// mount. Tanpa polyfill ini komponen tersebut melempar TypeError di test.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
