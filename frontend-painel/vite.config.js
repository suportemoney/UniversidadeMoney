import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedRoot = process.env.SHARED_UI_ROOT
  ? path.resolve(process.env.SHARED_UI_ROOT)
  : path.resolve(__dirname, "../shared");

const proxyTarget = process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000";

// Sem keep-alive: após recreate do backend o IP muda e o proxy não fica preso no IP antigo
const proxyAgent = new http.Agent({ keepAlive: false });

function backendProxy() {
  return {
    target: proxyTarget,
    changeOrigin: true,
    agent: proxyAgent,
  };
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": sharedRoot,
    },
  },
  server: {
    host: true,
    port: 5174,
    fs: {
      allow: [path.resolve(__dirname), sharedRoot],
    },
    proxy: {
      "/api": backendProxy(),
      "/admin": backendProxy(),
      "/static": backendProxy(),
      "/media": backendProxy(),
    },
  },
  build: {
    outDir: "dist",
  },
});
