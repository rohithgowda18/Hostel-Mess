import { useMemo, useState } from 'react';
import { isAuthenticated, getUser, logout } from '@/services/auth-service';
import { Navigate, Route, Routes } from 'react-router-dom';


import DashboardLayout from '@/layouts/dashboard-layout';
import DashboardPage from '@/pages/dashboard-page';
import LoginPage from '@/pages/login-page';
import GroupsPage from '@/pages/groups-page';
import GroupDetailPage from '@/pages/group-detail-page';
import StudentFoodPhotosPage from '@/pages/student-food-photos-page';

function App() {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [user, setUser] = useState(() => getUser());

  const appUser = useMemo(
    () => user || { email: 'student@hostel.app', role: 'STUDENT' },
    [user]
  );

  const handleLogin = () => {
    setUser(getUser());
    setAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setAuthenticated(false);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          authenticated ? (
            <DashboardLayout user={appUser} onLogout={handleLogout}>
              <DashboardPage />
            </DashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/student-photos"
        element={
          authenticated ? (
            <DashboardLayout user={appUser} onLogout={handleLogout}>
              <StudentFoodPhotosPage />
            </DashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/groups"
        element={
          authenticated ? (
            <DashboardLayout user={appUser} onLogout={handleLogout}>
              <GroupsPage />
            </DashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/groups/:groupId"
        element={
          authenticated ? (
            <DashboardLayout user={appUser} onLogout={handleLogout}>
              <GroupDetailPage />
            </DashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={authenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}

export default App;
