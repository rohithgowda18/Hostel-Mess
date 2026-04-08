import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '@/layouts/dashboard-layout';
import DashboardPage from '@/pages/dashboard-page';
import DailyMealPage from '@/pages/daily-meal-page';
import LoginPage from '@/pages/login-page';
import GroupsPage from '@/pages/groups-page';
import GroupDetailPage from '@/pages/group-detail-page';
import ComplaintsPage from '@/pages/complaints-page';
import LostFoundPage from '@/pages/lost-found-page';
import RoommatesPage from '@/pages/roommates-page';
import PostFoodPage from '@/pages/post-food-page';
import VotingPage from '@/pages/voting-page';
import { getUser, isAuthenticated, logout } from '@/services/auth-service';

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
        path="/daily-meal"
        element={
          authenticated ? (
            <DashboardLayout user={appUser} onLogout={handleLogout} activeTab="daily-meal">
              <DailyMealPage />
            </DashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/complaints"
        element={
          authenticated ? (
            <DashboardLayout user={appUser} onLogout={handleLogout} activeTab="complaints">
              <ComplaintsPage />
            </DashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/lost-found"
        element={
          authenticated ? (
            <DashboardLayout user={appUser} onLogout={handleLogout} activeTab="lost-found">
              <LostFoundPage />
            </DashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/roommates"
        element={
          authenticated ? (
            <DashboardLayout user={appUser} onLogout={handleLogout} activeTab="roommates">
              <RoommatesPage />
            </DashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/post-food"
        element={
          <DashboardLayout>
            <PostFoodPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/voting"
        element={
          <DashboardLayout>
            <VotingPage />
          </DashboardLayout>
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
