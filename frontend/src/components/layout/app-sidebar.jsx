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
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-200',
          'w-64',
          collapsed ? 'md:w-18' : 'md:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4">
          <div className={cn('flex items-center gap-3', collapsed && 'md:justify-center md:w-full')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
              <Utensils className="h-5 w-5" />
            </div>
            <div className={cn(collapsed && 'md:hidden')}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Hostel Mess Pro
                </span>
                <span className={cn(
                  'rounded-md px-1.5 py-0.2 text-[10px] font-bold border',
                  isAdmin
                    ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
                )}>
                  {isAdmin ? 'ADMIN' : 'STUDENT'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {isAdmin ? 'Operations Console' : 'Campus Dining'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && section.title && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isCurrentActive(item);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer',
                      active
                        ? 'bg-teal-50 text-teal-800 border border-teal-200/80 font-bold dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900/60'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
                      collapsed && 'md:justify-center md:px-0'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500')} />
                    <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
                    {!collapsed && item.badge && (
                      <span className="ml-auto rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-[10px] font-bold px-1.5 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Profile and Controls */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-1">
          <button
            type="button"
            onClick={() => handleNavigate('/student/profile')}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60 cursor-pointer',
              collapsed && 'md:justify-center md:px-0'
            )}
          >
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <span className={cn('truncate text-left', collapsed && 'md:hidden')}>
              <span className="block font-bold text-slate-900 dark:text-slate-100 truncate">
                {user.email?.split('@')[0] || 'My Profile'}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                {user.email || 'student@hostel.app'}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer',
              collapsed && 'md:justify-center md:px-0'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && 'md:hidden')}>Sign Out</span>
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex w-full items-center justify-center py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
