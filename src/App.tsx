import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppUpdater } from "./hooks/useAppUpdater";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Get the UpdateDialog component from the hook
  const { checkForUpdates, UpdateDialog } = useAppUpdater();
  // checkForUpdates();

  useEffect(() => {
    // Check on app start
    checkForUpdates(true); // silent mode, won't prompt if no update

    // Check every 6 hours
    const interval = setInterval(
      () => checkForUpdates(true),
      6 * 60 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <UpdateDialog />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
