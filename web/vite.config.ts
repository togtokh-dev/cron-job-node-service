import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Build гаралт backend-ийн public/ руу — сервер эндээс SPA-г үйлчилнэ.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  build: {
    outDir: "../public",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    // dev үед API-г backend рүү proxy хийнэ
    proxy: {
      "/cron-job": "http://localhost:2003"
    }
  }
});
