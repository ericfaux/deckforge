import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { vibecodePlugin } from "@vibecodeapp/webapp/plugin";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8000,
    allowedHosts: true, // Allow all hosts
  },
  plugins: [
    react(),
    mode === "development" && vibecodePlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Core — always in initial load
          if (/\/(react|react-dom|react-router-dom)\//.test(id)) return 'vendor-react';
          if (/\/(lucide-react|react-hot-toast)\//.test(id)) return 'vendor-ui';
          if (/\/@supabase\//.test(id)) return 'vendor-supabase';
          if (/\/(konva|react-konva)\//.test(id)) return 'vendor-konva';

          // Heavy — lazy-loaded on demand via dynamic import() or React.lazy()
          // Split three.js core from React bindings for parallel loading
          if (/\/@react-three\//.test(id)) return 'vendor-three-react';
          if (/\/three\//.test(id)) return 'vendor-three';
          if (/\/jspdf\//.test(id)) return 'vendor-jspdf';
          if (/\/paper\//.test(id)) return 'vendor-paper';
          if (/\/jszip\//.test(id)) return 'vendor-jszip';
          if (/\/@imgly\//.test(id)) return 'vendor-imgly';
          // onnxruntime-web pre-built bundles (ort.bundle.min, ort.webgpu.bundle.min)
          // are emitted as separate ~400 KB assets by Vite automatically.
          // Don't force them into a single chunk — let Vite split them naturally.
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
}));
