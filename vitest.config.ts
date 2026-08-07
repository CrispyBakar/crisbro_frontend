// M-12: Memisahkan konfigurasi Vitest dari vite.config.ts agar pengujian hanya memuat konfigurasi yang diperlukan tanpa bergantung pada plugin build aplikasi.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
