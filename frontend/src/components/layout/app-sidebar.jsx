import {
  ChevronsLeft,
  ChevronsRight,
  X,
  LogOut,
  User,
  ShieldCheck,
  Utensils
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getNavigationSections } from '@/config/navigation';
import { getUser, logout } from '@/services/auth-service';
import { cn } from '@/lib/utils';

export default function AppSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser() || {};
  const isAdmin = user?.role === 'ADMIN';
  const sections = getNavigationSections(user?.role);

  const handleNavigate = (path) => {
    navigate(path);
    onMobileClose?.();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isCurrentActive = (item) => {
    if (location.pathname === item.path) return true;
    if (item.path !== '/admin' && item.path !== '/student/dashboard' && location.pathname.startsWith(item.path)) {
      return true;
    }
    return false;
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-outline-variant/30 bg-surface-container-lowest transition-all duration-200',
          'w-64',
          collapsed ? 'md:w-18' : 'md:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-outline-variant/20 px-4">
          <div className={cn('flex items-center gap-3', collapsed && 'md:justify-center md:w-full')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Utensils className="h-5 w-5" />
            </div>
            <div className={cn(collapsed && 'md:hidden')}>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-primary">
                  MessMaster
                </span>
                <span className={cn(
                  'rounded px-1.5 py-0.2 text-[10px] font-bold',
                  isAdmin
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-primary-fixed text-on-primary-fixed'
                )}>
                  {isAdmin ? 'ADMIN' : 'STUDENT'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-on-surface-variant">
                {isAdmin ? 'Operations Console' : 'Hostel Portal'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Mess Status Widget */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between border border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                <span className="text-xs text-on-surface-variant font-medium">Mess Hall Status</span>
              </div>
              <span className="text-[11px] font-semibold text-secondary px-2 py-0.5 rounded bg-secondary-container/40">
                Open
              </span>
            </div>
          </div>
        )}

        {/* Navigation Section Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && section.title && (
                <p className="px-2.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-outline">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isCurrentActive(item);
                const isAction = item.isAction;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all cursor-pointer text-left',
                      active
                        ? 'bg-primary text-on-primary font-medium shadow-sm'
                        : isAction
                        ? 'text-primary font-semibold hover:bg-primary-fixed/30'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                      collapsed && 'md:justify-center md:px-0'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-on-primary' : isAction ? 'text-primary' : 'text-on-surface-variant')} />
                    <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
                    {!collapsed && isAction && (
                      <span className={cn(
                        'ml-auto text-[10px] font-semibold px-1.5 py-0.2 rounded',
                        active ? 'bg-white/20 text-white' : 'bg-primary-fixed text-primary'
                      )}>
                        Action
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Profile and Controls */}
        <div className="border-t border-outline-variant/20 p-3 space-y-1 bg-surface-container-lowest">
          <div className="rounded-lg bg-surface-container p-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleNavigate('/student/profile')}
              className={cn(
                'flex items-center gap-2.5 text-left min-w-0 cursor-pointer',
                collapsed && 'md:justify-center md:w-full'
              )}
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shrink-0">
                {user.email?.slice(0, 2)?.toUpperCase() || 'ST'}
              </div>
              <div className={cn('truncate', collapsed && 'md:hidden')}>
                <span className="block text-xs font-semibold text-on-surface truncate">
                  {user.name || user.email?.split('@')[0] || 'Resident Diner'}
                </span>
                <span className="block text-[10px] text-on-surface-variant truncate">
                  {user.roomNumber ? `Room ${user.roomNumber}` : user.hostel || 'Hostel Resident'}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className={cn(
                'p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors cursor-pointer',
                collapsed && 'md:hidden'
              )}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex w-full items-center justify-center py-1 rounded-lg text-outline hover:text-on-surface text-xs"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
