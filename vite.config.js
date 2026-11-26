// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("/react/") ||
              id.includes("\\react\\") ||
              id.includes("/react-dom/") ||
              id.includes("\\react-dom\\") ||
              id.includes("/react-router-dom/") ||
              id.includes("\\react-router-dom\\") ||
              id.includes("/react-router/") ||
              id.includes("\\react-router\\") ||
              id.includes("/react-helmet-async/") ||
              id.includes("\\react-helmet-async\\") ||
              id.includes("/scheduler/") ||
              id.includes("\\scheduler\\")
            ) {
              return "vendor-core";
            }
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            if (id.includes("framer-motion")) {
              return "motion";
            }
            if (id.includes("react-icons")) {
              return "vendor-icons";
            }
            if (id.includes("lenis")) {
              return "vendor-lenis";
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});