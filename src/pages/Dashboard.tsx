import { Routes, Route, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EmployeeDirectory } from '@/components/employees/EmployeeDirectory';
import { EmployeeProfile } from '@/components/employees/EmployeeProfile';
import { EnhancedProfile } from '@/components/profile/EnhancedProfile';
import OnboardingDashboard from '@/components/onboarding/OnboardingDashboard';
import EmployeeOnboarding from '@/components/onboarding/EmployeeOnboarding';
import OnboardingTemplates from '@/components/onboarding/OnboardingTemplates';
import BulkOnboarding from '@/components/onboarding/BulkOnboarding';
import DashboardOverview from '@/components/dashboard/DashboardOverview';

const EmployeeProfileWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <EmployeeProfile employeeId={id || ""} />;
};

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="employees" element={<EmployeeDirectory />} />
        <Route path="employees/:id" element={<EmployeeProfileWrapper />} />
        <Route path="profile" element={<EnhancedProfile />} />
        <Route path="onboarding" element={<OnboardingDashboard />} />
        <Route path="onboarding/templates" element={<OnboardingTemplates />} />
        <Route path="onboarding/bulk" element={<BulkOnboarding />} />
        <Route path="my-onboarding" element={<EmployeeOnboarding />} />
      </Routes>
    </DashboardLayout>
  );
}