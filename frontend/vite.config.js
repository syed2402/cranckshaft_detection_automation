import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      middlewareMode: false,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "*.railway.app",
        "abundant-renewal-production-7c00.up.railway.app"
      ]
    },
    preview: {
      port: 3000,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "*.railway.app",
        "abundant-renewal-production-7c00.up.railway.app"
      ]
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || 'https://cranckshaftdetectionautomation-production.up.railway.app'
      )
    }
  };
});
