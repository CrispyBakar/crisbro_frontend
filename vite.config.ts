import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Di Netlify (NETLIFY=true), build tanpa VITE_API_BASE_URL akan menghasilkan
  // request ke "undefined/login". Gagalkan build supaya tidak ter-deploy.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (
    command === "build" &&
    process.env.NETLIFY === "true" &&
    !env.VITE_API_BASE_URL
  ) {
    throw new Error(
      "VITE_API_BASE_URL belum diisi di environment variables Netlify",
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
