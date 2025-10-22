import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { UserManagement } from '@/components/admin/UserManagement';
import { EmployeeManagement } from '@/components/employees/EmployeeManagement';
import { AuditLogDashboard } from '@/components/admin/AuditLogDashboard';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { EnhancedProfile } from '@/components/profile/EnhancedProfile';
import { OnboardingDetailsForm } from '@/components/onboarding/OnboardingDetailsForm';
import { EmployeeOnboardingDashboard } from '@/components/onboarding/EmployeeOnboardingDashboard';
import { HROnboardingDashboard } from '@/components/onboarding/HROnboardingDashboard';
import AIChat from '@/components/AIChat';

const Dashboard = () => {
  const { profile } = useAuth();

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/audit" element={<AuditLogDashboard />} />
        <Route path="/notifications" element={<NotificationCenter />} />
        <Route path="/profile" element={<EnhancedProfile />} />
        <Route path="/onboarding" element={
          profile?.role === 'employee' ? <EmployeeOnboardingDashboard /> : <HROnboardingDashboard />
        } />
        <Route path="/onboarding/form" element={<OnboardingDetailsForm />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default Dashboard;