import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/app-sidebar';
import TopNavbar from '@/components/layout/top-navbar';
import { studentMobileNav, adminMobileNav } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { getUser, getToken } from '@/services/auth-service';
import websocketService from '@/services/websocket-service';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Sparkles,
  QrCode,
  Star,
  MessageSquareWarning,
  Users,
  Bell,
  User,
  ShieldCheck,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  X
} from 'lucide-react';

export default function DashboardLayout({ user, onLogout, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  const currentUser = user || getUser() || { email: 'student@hostel.app', role: 'STUDENT' };
  const isAdmin = currentUser.role === 'ADMIN';

  // Persistent WebSocket connection while logged in
  useEffect(() => {
    const token = getToken();
    if (token) {
      websocketService.connect(token).catch(() => {});
    }
  }, [currentUser?.email]);

  // Close menus on route navigation
  useEffect(() => {
    setMoreDrawerOpen(false);
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const mobileNavItems = isAdmin ? adminMobileNav : studentMobileNav;

  const secondaryStudentNav = [
    { label: 'Attendance / Dining Pass', path: '/student/attendance', icon: QrCode },
    { label: 'Rate Meal Quality', path: '/student/feedback', icon: Star },
    { label: 'File Complaint / Issue', path: '/student/complaints', icon: MessageSquareWarning },
    { label: 'Hostel Notices', path: '/student/notices', icon: Bell }
  ];

  const secondaryAdminNav = [
    { label: 'Attendance Records', path: '/admin/attendance', icon: ClipboardCheck },
    { label: 'Ratings & Quality', path: '/admin/ratings', icon: Star },
    { label: 'Analytics & Trends', path: '/admin/analytics', icon: TrendingUp },
    { label: 'Student Management', path: '/admin/students', icon: Users },
    { label: 'Notices Board', path: '/admin/notices', icon: Bell },
    { label: 'Admin Role Governance', path: '/admin/management', icon: ShieldCheck }
  ];

  const drawerLinks = isAdmin ? secondaryAdminNav : secondaryStudentNav;

  return (
    <div className="min-h-screen bg-page text-on-surface flex flex-col md:flex-row max-w-full overflow-x-hidden">
      {/* Desktop & Mobile Sidebar */}
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden transition-all duration-200',
          collapsed ? 'md:ml-18' : 'md:ml-64'
        )}
      >
        {/* Top Navbar */}
        <TopNavbar
          collapsed={collapsed}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          user={currentUser}
          onLogout={onLogout}
        />

        {/* Page Content Body */}
        <main className="flex-1 mt-16 px-3 sm:px-4 py-6 md:px-8 max-w-6xl w-full mx-auto pb-24 md:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Secondary Menu Bottom Sheet */}
      {moreDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMoreDrawerOpen(false)}
          />
          <div className="relative z-10 bg-surface-container-lowest border-t border-outline-variant/30 rounded-t-2xl p-4 space-y-2 shadow-xl animate-in slide-in-from-bottom-6 duration-200 pb-safe">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Additional Services
              </span>
              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {drawerLinks.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      setMoreDrawerOpen(false);
                      navigate(item.path);
                    }}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-colors cursor-pointer',
                      active
                        ? 'bg-primary-fixed/40 text-primary border-primary'
                        : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 flex items-center justify-around h-16 px-1 pb-safe shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors cursor-pointer',
                active
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center h-7 w-7 rounded-lg mb-0.5 transition-colors',
                  item.isHero && 'bg-primary text-on-primary shadow-xs',
                  !item.isHero && active && 'text-primary',
                  !item.isHero && !active && 'text-on-surface-variant'
                )}
              >
                <Icon className={cn('h-4 w-4', item.isHero && 'h-4.5 w-4.5')} />
              </div>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* Dedicated Mobile Menu Drawer Trigger */}
        <button
          type="button"
          onClick={() => setMoreDrawerOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors cursor-pointer',
            moreDrawerOpen ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          <div className="flex items-center justify-center h-7 w-7 rounded-lg mb-0.5 text-on-surface-variant">
            <MoreHorizontal className="h-4 w-4" />
          </div>
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
