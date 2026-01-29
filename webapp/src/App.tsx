import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DeckForge from "./pages/DeckForge";
import Auth from "./pages/Auth";
import Designs from "./pages/Designs";
import Templates from "./pages/Templates";
import Gallery from "./pages/Gallery";
import ShareView from "./pages/ShareView";
import Marketplace from "./pages/Marketplace";
import MarketplaceDesign from "./pages/MarketplaceDesign";
import MarketplaceUpload from "./pages/MarketplaceUpload";
import DesignerDashboard from "./pages/DesignerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/share/:token" element={<ShareView />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
