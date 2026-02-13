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
        manualChunks: {
          // Core — always in initial load
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-konva': ['konva', 'react-konva'],

          // Lazy-loaded heavy deps (each loads on demand, not in initial bundle)
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-jspdf': ['jspdf'],
          'vendor-paper': ['paper'],
        },
      },
    },
    chunkSizeWarningLimit: 300,
  },
}));
