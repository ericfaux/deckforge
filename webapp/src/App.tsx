import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { ShortcutDebugPanel } from "@/components/debug/ShortcutDebug";
import { LoadingState } from "@/components/LoadingState";
import NotFound from "./pages/NotFound";

// Retry wrapper for dynamic imports to handle stale chunks after deployments.
// If the initial import fails (e.g. hash mismatch), reload the page once to
// get the latest HTML with updated chunk references.
function lazyWithRetry(importFn: () => Promise<{ default: React.ComponentType<any> }>) {
  return lazy(() =>
    importFn().catch((error: unknown) => {
      const key = "chunk_reload_" + (error instanceof Error ? error.message : "unknown");
      const hasReloaded = sessionStorage.getItem(key);
      if (!hasReloaded) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        // Return a never-resolving promise so React doesn't render before reload
        return new Promise(() => {});
      }
      // Already reloaded once — let ErrorBoundary handle it
      throw error;
    })
  );
}

// Lazy-load route-level page components for code splitting
const DeckForge = lazyWithRetry(() => import("./pages/DeckForge"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Designs = lazyWithRetry(() => import("./pages/Designs"));
const Templates = lazyWithRetry(() => import("./pages/Templates"));
const Gallery = lazyWithRetry(() => import("./pages/Gallery"));
const ShareView = lazyWithRetry(() => import("./pages/ShareView"));
const Marketplace = lazyWithRetry(() => import("./pages/Marketplace"));
const MarketplaceDesign = lazyWithRetry(() => import("./pages/MarketplaceDesign"));
const MarketplaceUpload = lazyWithRetry(() => import("./pages/MarketplaceUpload"));
const DesignerDashboard = lazyWithRetry(() => import("./pages/DesignerDashboard"));
const FingerparkBuilder = lazyWithRetry(() => import("./pages/FingerparkBuilder"));

const queryClient = new QueryClient();

function KeyboardNavigationManager() {
  useKeyboardNavigation();
  return null;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <KeyboardNavigationManager />
      <TooltipProvider>
        <Toaster />
        <ShortcutDebugPanel />
        <BrowserRouter>
          <Breadcrumb />
          <Suspense fallback={<LoadingState fullScreen />}>
            <Routes>
              <Route path="/" element={<DeckForge />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/designs" element={<Designs />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/design/:id" element={<MarketplaceDesign />} />
              <Route path="/marketplace/upload" element={<MarketplaceUpload />} />
              <Route path="/marketplace/dashboard" element={<DesignerDashboard />} />
              <Route path="/fingerpark" element={<FingerparkBuilder />} />
              <Route path="/share/:token" element={<ShareView />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
