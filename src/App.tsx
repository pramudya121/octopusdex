import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { HelmetProvider } from 'react-helmet-async';
import { wagmiConfig } from '@/config/wagmi';
import Index from "./pages/Index";
import Liquidity from "./pages/Liquidity";
import Pools from "./pages/Pools";
import Analytics from "./pages/Analytics";
import Portfolio from "./pages/Portfolio";
import Faucet from "./pages/Faucet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/liquidity" element={<Liquidity />} />
              <Route path="/pools" element={<Pools />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/faucet" element={<Faucet />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </HelmetProvider>
);

export default App;
