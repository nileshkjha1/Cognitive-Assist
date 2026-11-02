import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CameraMemory from "./pages/CameraMemory";
import MemoryTimelinePage from "./pages/MemoryTimelinePage";
import MapTracking from "./pages/MapTracking";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import KnownPeopleList from "./pages/KnownPeopleList";
import AddPerson from "./pages/AddPerson";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import GlobalSubtitles from "./components/GlobalSubtitles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/camera-memory" element={<CameraMemory />} />
            <Route path="/memory-timeline" element={<MemoryTimelinePage />} />
            <Route path="/map-tracking" element={<MapTracking />} />
            <Route path="/caregiver-dashboard" element={<CaregiverDashboard />} />
            <Route path="/known-people" element={<KnownPeopleList />} />
            <Route path="/add-person" element={<AddPerson />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
        <GlobalSubtitles />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
