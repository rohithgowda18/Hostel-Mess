import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/app-sidebar';
import TopNavbar from '@/components/layout/top-navbar';
import { studentMobileNav, studentMoreNav, adminMobileNav } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { getUser, getToken } from '@/services/auth-service';
import websocketService from '@/services/websocket-service';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Sparkles,
  Users,
  MoreHorizontal,
  X,
  QrCode,
  MessageSquareWarning,
  Bell,
  User,
  ChevronRight
} from 'lucide-react';

export default function DashboardLayout({ user, onLogout, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
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

  // Close More drawer on navigation
  useEffect(() => {
    setMoreDrawerOpen(false);
  }, [location.pathname]);

  const mobileNavItems = isAdmin ? adminMobileNav : studentMobileNav;
  const moreNavItems = isAdmin ? [] : studentMoreNav;

  // Determine if current route is under "More"
  const isMoreActive = moreNavItems.some((item) => location.pathname === item.path);

  const isItemActive = (item) => location.pathname === item.path;

  return (
    <div className="min-h-screen bg-page text-on-surface flex flex-col md:flex-row max-w-full overflow-x-hidden">
      {/* Desktop Sidebar — hidden on mobile */}
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={false}
        onMobileClose={() => {}}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden transition-all duration-200',
          collapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
        {/* Top Navbar */}
        <TopNavbar
          collapsed={collapsed}
          onOpenSidebar={() => {}} // sidebar not used on mobile anymore
          user={currentUser}
          onLogout={onLogout}
        />

        {/* Page Content Body */}
        <main className="flex-1 mt-16 px-3 sm:px-4 py-6 md:px-8 max-w-6xl w-full mx-auto pb-24 md:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ───────── Mobile Bottom Navigation ───────── */}
      {/* Only visible on mobile (md:hidden) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest border-t border-outline-variant/30 flex items-stretch h-16 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors cursor-pointer pt-1',
                active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-6 rounded-lg transition-colors',
                  item.isHero && 'bg-primary text-on-primary w-10 h-7 rounded-xl',
                  !item.isHero && active && 'text-primary',
                  !item.isHero && !active && 'text-on-surface-variant'
                )}
              >
                <Icon className={cn('h-4 w-4', item.isHero && 'h-4 w-4')} />
              </div>
              <span className="truncate leading-none">{item.label}</span>
            </button>
          );
        })}

        {/* More button — only for students */}
        {!isAdmin && (
          <button
            type="button"
            onClick={() => setMoreDrawerOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors cursor-pointer pt-1',
              isMoreActive || moreDrawerOpen
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
            aria-label="More navigation"
            aria-expanded={moreDrawerOpen}
          >
            <div
              className={cn(
                'flex items-center justify-center w-8 h-6 rounded-lg',
                (isMoreActive || moreDrawerOpen) ? 'text-primary' : 'text-on-surface-variant'
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </div>
            <span className="leading-none">More</span>
          </button>
        )}
      </nav>

      {/* ───────── More Drawer (bottom sheet) ───────── */}
      {moreDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close more menu"
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMoreDrawerOpen(false)}
          />

          {/* Sheet */}
          <div className="relative z-10 bg-surface-container-lowest border-t border-outline-variant/30 rounded-t-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-200">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                More
              </span>
              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Destination list */}
            <div className="px-3 py-3 space-y-1" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setMoreDrawerOpen(false);
                      navigate(item.path);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer text-left',
                      active
                        ? 'bg-primary-fixed/30 text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-on-surface-variant')} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
