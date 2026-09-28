import { useMemo, useState, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { isAuthenticated, getUser, logout } from '@/services/auth-service';

import DashboardLayout from '@/layouts/dashboard-layout';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';

// Student Pages
import DashboardPage from '@/pages/student/DashboardPage';
import MealsPage from '@/pages/student/MealsPage';
import ReportMealPage from '@/pages/student/ReportMealPage';
import AttendancePage from '@/pages/student/AttendancePage';
import FeedbackPage from '@/pages/student/FeedbackPage';
import ComplaintsPage from '@/pages/student/ComplaintsPage';
import GroupsPage from '@/pages/student/GroupsPage';
import GroupDetailsPage from '@/pages/student/GroupDetailsPage';
import NoticesPage from '@/pages/student/NoticesPage';
import ProfilePage from '@/pages/student/ProfilePage';

// Admin Pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminMealsPage from '@/pages/admin/AdminMealsPage';
import AdminMenuPage from '@/pages/admin/AdminMenuPage';
import AdminAttendancePage from '@/pages/admin/AdminAttendancePage';
import AdminRatingsPage from '@/pages/admin/AdminRatingsPage';
import AdminComplaintsPage from '@/pages/admin/AdminComplaintsPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import AdminStudentsPage from '@/pages/admin/AdminStudentsPage';
import AdminNoticesPage from '@/pages/admin/AdminNoticesPage';
import AdminManagementPage from '@/pages/admin/AdminManagementPage';

export function AppRoutes() {
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

  const withLayout = (Component) =>
    authenticated ? (
      <DashboardLayout user={appUser} onLogout={handleLogout}>
        <Component />
      </DashboardLayout>
    ) : (
      <Navigate to="/login" replace />
    );

  const withAdminLayout = (Component) => {
    if (!authenticated) {
      return <Navigate to="/login" replace />;
    }
    if (!isAdmin) {
      return <Navigate to="/student/dashboard" replace />;
    }
    return (
      <DashboardLayout user={appUser} onLogout={handleLogout}>
        <Component />
      </DashboardLayout>
    );
  };

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          authenticated ? (
            <Navigate to={isAdmin ? '/admin' : '/student/dashboard'} replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />

      {/* Root redirect depending on role */}
      <Route
        path="/"
        element={<Navigate to={isAdmin ? '/admin' : '/student/dashboard'} replace />}
      />

      {/* STUDENT ROUTES */}
      <Route path="/student/dashboard" element={withLayout(DashboardPage)} />
      <Route path="/student/meals" element={withLayout(MealsPage)} />
      <Route path="/student/report-meal" element={withLayout(ReportMealPage)} />
      <Route path="/student/attendance" element={withLayout(AttendancePage)} />
      <Route path="/student/feedback" element={withLayout(FeedbackPage)} />
      <Route path="/student/complaints" element={withLayout(ComplaintsPage)} />
      <Route path="/student/groups" element={withLayout(GroupsPage)} />
      <Route path="/student/groups/:groupId" element={withLayout(GroupDetailsPage)} />
      <Route path="/student/notices" element={withLayout(NoticesPage)} />
      <Route path="/student/profile" element={withLayout(ProfilePage)} />

      {/* ADMIN ROUTES */}
      <Route path="/admin" element={withAdminLayout(AdminDashboardPage)} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/meals" element={withAdminLayout(AdminMealsPage)} />
      <Route path="/admin/menu" element={withAdminLayout(AdminMenuPage)} />
      <Route path="/admin/attendance" element={withAdminLayout(AdminAttendancePage)} />
      <Route path="/admin/ratings" element={withAdminLayout(AdminRatingsPage)} />
      <Route path="/admin/complaints" element={withAdminLayout(AdminComplaintsPage)} />
      <Route path="/admin/analytics" element={withAdminLayout(AdminAnalyticsPage)} />
      <Route path="/admin/students" element={withAdminLayout(AdminStudentsPage)} />
      <Route path="/admin/notices" element={withAdminLayout(AdminNoticesPage)} />
      <Route path="/admin/management" element={withAdminLayout(AdminManagementPage)} />

      {/* Legacy and Aliases for Backward Compatibility */}
      <Route path="/student/dining" element={<Navigate to="/student/attendance" replace />} />
      <Route path="/qr-checkin" element={<Navigate to="/student/attendance" replace />} />
      <Route path="/meals" element={<Navigate to="/student/meals" replace />} />
      <Route path="/report-meal" element={<Navigate to="/student/report-meal" replace />} />
      <Route path="/attendance" element={<Navigate to="/student/attendance" replace />} />
      <Route path="/feedback" element={<Navigate to="/student/feedback" replace />} />
      <Route path="/complaints" element={<Navigate to={isAdmin ? '/admin/complaints' : '/student/complaints'} replace />} />
      <Route path="/notices" element={<Navigate to={isAdmin ? '/admin/notices' : '/student/notices'} replace />} />
      <Route path="/profile" element={<Navigate to="/student/profile" replace />} />
      <Route path="/groups" element={<Navigate to="/student/groups" replace />} />
      <Route path="/groups/:groupId" element={withLayout(GroupDetailsPage)} />
      <Route path="/student-photos" element={<Navigate to="/student/meals?tab=photos" replace />} />
      <Route path="/admin/quality" element={<Navigate to="/admin/ratings" replace />} />
      <Route path="/dashboard" element={<Navigate to={isAdmin ? '/admin' : '/student/dashboard'} replace />} />

      {/* Catch-all fallback */}
      <Route
        path="*"
        element={<Navigate to={authenticated ? (isAdmin ? '/admin' : '/student/dashboard') : '/login'} replace />}
      />
    </Routes>
  );
}

export default AppRoutes;
