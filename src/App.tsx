import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AttendancePage from "./pages/dashboard/AttendancePage";
import VotingPage from "./pages/dashboard/VotingPage";
import TeacherVotingPage from "./pages/dashboard/TeacherVotingPage";
import ComplaintsPage from "./pages/dashboard/ComplaintsPage";
import CertificatesPage from "./pages/dashboard/CertificatesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/attendance" element={<AttendancePage />} />
          <Route path="/dashboard/voting" element={<VotingPage />} />
          <Route path="/dashboard/teacher-voting" element={<TeacherVotingPage />} />
          <Route path="/dashboard/complaints" element={<ComplaintsPage />} />
          <Route path="/dashboard/certificates" element={<CertificatesPage />} />
          <Route path="/dashboard/analytics" element={<DashboardPage />} />
          <Route path="/dashboard/verification" element={<DashboardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
