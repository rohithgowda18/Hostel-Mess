import { useMemo, useState, useEffect } from 'react';
import { isAuthenticated, getUser, logout } from '@/services/auth-service';
import { Navigate, Route, Routes } from 'react-router-dom';

import DashboardLayout from '@/layouts/dashboard-layout';
import LoginPage from '@/pages/login-page';

// Student Pages
import DashboardPage from '@/pages/dashboard-page';
import MealsPage from '@/pages/meals-page';
import QrCheckinPage from '@/pages/qr-checkin-page';
import ComplaintsPage from '@/pages/complaints-page';
import FeedbackPage from '@/pages/feedback-page';
import PollsPage from '@/pages/polls-page';
import NoticesPage from '@/pages/notices-page';
import DirectoryPage from '@/pages/directory-page';
import ProfilePage from '@/pages/profile-page';
import GroupsPage from '@/pages/groups-page';
import GroupDetailPage from '@/pages/group-detail-page';
import ReportMealPage from '@/pages/report-meal-page';

// Admin Pages
import AdminDashboardPage from '@/pages/admin-dashboard-page';
import AdminAttendancePage from '@/pages/admin-attendance-page';
import AdminQualityPage from '@/pages/admin-quality-page';
import AdminMenuPage from '@/pages/admin-menu-page';
import AdminWastePage from '@/pages/admin-waste-page';
import KitchenAnalyticsPage from '@/pages/kitchen-analytics-page';
import AdminStudentsPage from '@/pages/admin-students-page';
import AdminVendorPage from '@/pages/admin-vendor-page';

function App() {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [user, setUser] = useState(() => getUser());

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getUser());
      setAuthenticated(isAuthenticated());
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const appUser = useMemo(
    () => user || { email: 'student@hostel.app', role: 'STUDENT' },
    [user]
  );

  const isAdmin = appUser.role === 'ADMIN';

  const handleLogin = () => {
    setUser(getUser());
    setAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setAuthenticated(false);
  };

  // Helper wrapper for protected pages
  const withLayout = (Component) =>
    authenticated ? (
      <DashboardLayout user={appUser} onLogout={handleLogout}>
        <Component />
      </DashboardLayout>
    ) : (
      <Navigate to="/login" replace />
    );

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authenticated ? (
            <Navigate to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />

      {/* Root redirect depending on role */}
      <Route
        path="/"
        element={<Navigate to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} replace />}
      />

      {/* ========================================================= */}
      {/* STUDENT ROUTES (User Spec #1, #2)                         */}
      {/* ========================================================= */}
      <Route path="/student/dashboard" element={withLayout(DashboardPage)} />
      <Route path="/student/meals" element={withLayout(MealsPage)} />
      <Route path="/student/dining" element={withLayout(QrCheckinPage)} />
      <Route path="/student/complaints" element={withLayout(ComplaintsPage)} />
      <Route path="/student/feedback" element={withLayout(FeedbackPage)} />
      <Route path="/student/polls" element={withLayout(PollsPage)} />
      <Route path="/student/notices" element={withLayout(NoticesPage)} />
      <Route path="/student/profile" element={withLayout(ProfilePage)} />
      <Route path="/student/settings" element={withLayout(ProfilePage)} />

      {/* ========================================================= */}
      {/* ADMIN ROUTES (User Spec #1, #2)                           */}
      {/* ========================================================= */}
      <Route path="/admin/dashboard" element={withLayout(AdminDashboardPage)} />
      <Route path="/admin/attendance" element={withLayout(AdminAttendancePage)} />
      <Route path="/admin/complaints" element={withLayout(ComplaintsPage)} />
      <Route path="/admin/quality" element={withLayout(AdminQualityPage)} />
      <Route path="/admin/menu" element={withLayout(AdminMenuPage)} />
      <Route path="/admin/waste" element={withLayout(AdminWastePage)} />
      <Route path="/admin/analytics" element={withLayout(KitchenAnalyticsPage)} />
      <Route path="/admin/students" element={withLayout(AdminStudentsPage)} />
      <Route path="/admin/polls" element={withLayout(PollsPage)} />
      <Route path="/admin/notices" element={withLayout(NoticesPage)} />
      <Route path="/admin/vendor" element={withLayout(AdminVendorPage)} />
      <Route path="/admin/settings" element={withLayout(ProfilePage)} />

      {/* ========================================================= */}
      {/* ALIAS & DIRECT ROUTES FOR BACKWARD COMPATIBILITY          */}
      {/* ========================================================= */}
      <Route
        path="/dashboard"
        element={withLayout(isAdmin ? AdminDashboardPage : DashboardPage)}
      />
      <Route path="/meals" element={withLayout(MealsPage)} />
      <Route path="/qr-checkin" element={withLayout(QrCheckinPage)} />
      <Route path="/complaints" element={withLayout(ComplaintsPage)} />
      <Route path="/feedback" element={withLayout(FeedbackPage)} />
      <Route path="/polls" element={withLayout(PollsPage)} />
      <Route path="/notices" element={withLayout(NoticesPage)} />
      <Route path="/analytics" element={withLayout(KitchenAnalyticsPage)} />
      <Route path="/directory" element={withLayout(DirectoryPage)} />
      <Route path="/profile" element={withLayout(ProfilePage)} />
      <Route path="/groups" element={withLayout(GroupsPage)} />
      <Route path="/groups/:groupId" element={withLayout(GroupDetailPage)} />
      <Route path="/report-meal" element={withLayout(ReportMealPage)} />
      <Route path="/student-photos" element={<Navigate to="/meals?tab=photos" replace />} />

      {/* Catch-all fallback */}
      <Route
        path="*"
        element={<Navigate to={authenticated ? (isAdmin ? '/admin/dashboard' : '/student/dashboard') : '/login'} replace />}
      />
    </Routes>
  );
}

export default App;
