import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/app-sidebar';
import TopNavbar from '@/components/layout/top-navbar';
import { studentMobileNav, adminMobileNav } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { getUser } from '@/services/auth-service';
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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex">
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
          'flex-1 flex flex-col min-w-0 transition-all duration-200',
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
        <main className="flex-1 mt-16 px-4 py-6 md:px-8 max-w-6xl w-full mx-auto pb-24 md:pb-8">
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
          <div className="relative z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl p-4 space-y-2 shadow-xl animate-in slide-in-from-bottom-6 duration-200 pb-safe">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Additional Services
              </span>
              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                        ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around h-15 px-2 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.03)]">
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
                  ? 'text-teal-800 dark:text-teal-300 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center h-7 w-7 rounded-md mb-0.5 transition-colors',
                  item.isHero && 'bg-teal-700 text-white dark:bg-teal-500 dark:text-slate-950 shadow-xs',
                  !item.isHero && active && 'text-teal-700 dark:text-teal-400'
                )}
              >
                <Icon className={cn('h-4 w-4', item.isHero && 'h-4.5 w-4.5')} />
              </div>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
