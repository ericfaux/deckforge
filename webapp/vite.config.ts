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
          // Core React and UI libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          
          // Heavy libraries
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // Our component groups (lazy loaded)
          'modals': [
            './src/components/deckforge/ExportPreview.tsx',
            './src/components/deckforge/ExportPresetsModal.tsx',
            './src/components/deckforge/VersionHistory.tsx',
            './src/components/deckforge/ShareModal.tsx',
            './src/components/deckforge/BrandKitModal.tsx',
            './src/components/deckforge/FontUploadModal.tsx',
            './src/components/deckforge/ArrayDuplicateModal.tsx',
          ],
        },
      },
    },
    // Increase chunk size warning limit since we're splitting intentionally
    chunkSizeWarningLimit: 600,
  },
}));
