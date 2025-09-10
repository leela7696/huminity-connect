import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { UserManagement } from "@/components/admin/UserManagement";
import { AuditLogDashboard } from "@/components/admin/AuditLogDashboard";
import { EnhancedProfile } from "@/components/profile/EnhancedProfile";
import { EmployeeDirectory } from "@/components/employees/EmployeeDirectory";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            } />
            <Route path="/dashboard/users" element={
              <DashboardLayout>
                <UserManagement />
              </DashboardLayout>
            } />
            <Route path="/dashboard/audit" element={
              <DashboardLayout>
                <AuditLogDashboard />
              </DashboardLayout>
            } />
            <Route path="/dashboard/profile" element={
              <DashboardLayout>
                <EnhancedProfile />
              </DashboardLayout>
            } />
            <Route path="/dashboard/employees" element={
              <DashboardLayout>
                <EmployeeDirectory />
              </DashboardLayout>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
