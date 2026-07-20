import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const surface = env.VITE_SURFACE || mode || "plataforma";
  const proxyTarget = env.VITE_PROXY_TARGET || "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_SURFACE": JSON.stringify(surface),
    },
    server: {
      host: true,
      port: surface === "interno" ? 5175 : 5173,
      proxy: {
        "/api": { target: proxyTarget, changeOrigin: true },
        "/admin": { target: proxyTarget, changeOrigin: true },
        "/static": { target: proxyTarget, changeOrigin: true },
        "/media": { target: proxyTarget, changeOrigin: true },
      },
    },
    build: {
      outDir: "dist",
    },
  };
});
