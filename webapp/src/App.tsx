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

// Lazy-load route-level page components for code splitting
const DeckForge = lazy(() => import("./pages/DeckForge"));
const Auth = lazy(() => import("./pages/Auth"));
const Designs = lazy(() => import("./pages/Designs"));
const Templates = lazy(() => import("./pages/Templates"));
const Gallery = lazy(() => import("./pages/Gallery"));
const ShareView = lazy(() => import("./pages/ShareView"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const MarketplaceDesign = lazy(() => import("./pages/MarketplaceDesign"));
const MarketplaceUpload = lazy(() => import("./pages/MarketplaceUpload"));
const DesignerDashboard = lazy(() => import("./pages/DesignerDashboard"));
const FingerparkBuilder = lazy(() => import("./pages/FingerparkBuilder"));

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
