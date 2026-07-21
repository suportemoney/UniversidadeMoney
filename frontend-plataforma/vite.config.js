import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedRoot = process.env.SHARED_UI_ROOT
  ? path.resolve(process.env.SHARED_UI_ROOT)
  : path.resolve(__dirname, "../shared");

// Sem keep-alive: após recreate do backend o IP muda e o proxy não fica preso no IP antigo
const proxyAgent = new http.Agent({ keepAlive: false });

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const surface = env.VITE_SURFACE || mode || "plataforma";
  const proxyTarget = env.VITE_PROXY_TARGET || "http://127.0.0.1:8000";

  function backendProxy() {
    return {
      target: proxyTarget,
      changeOrigin: true,
      agent: proxyAgent,
    };
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@shared": sharedRoot,
      },
    },
    server: {
      host: true,
      port: surface === "interno" ? 5175 : 5173,
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
    define: {
      "import.meta.env.VITE_SURFACE": JSON.stringify(surface),
    },
    build: {
      outDir: "dist",
    },
  };
});
