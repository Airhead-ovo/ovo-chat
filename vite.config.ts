import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiPrefix = env.VITE_API_BASE_URL || "/api";
  const useProxy = apiPrefix.startsWith("/");

  return {
  plugins: [react()],
  // Browser requests stay same-origin; only Vite talks to FastAPI.
  server: {
    host: env.VITE_DEV_HOST || "127.0.0.1",
    port: Number(env.VITE_DEV_PORT || 5173),
    strictPort: true,
    proxy: useProxy ? {
      [apiPrefix]: {
        target: env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.slice(apiPrefix.length) || "/",
      },
    } : undefined,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
})
