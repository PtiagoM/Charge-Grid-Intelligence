import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  envDir: "../..",
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    strictPort: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@zxing/browser")) return "zxing-browser";
          if (id.includes("node_modules/@zxing/")) return "zxing-core";
          if (id.includes("node_modules/@supabase/")) return "supabase";
          if (id.includes("node_modules/@stripe/")) return "stripe";
          return undefined;
        }
      }
    }
  }
});
