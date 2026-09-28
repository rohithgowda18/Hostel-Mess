import {
  ChevronsLeft,
  ChevronsRight,
  X,
  LogOut,
  User,
  ShieldCheck,
  Building,
  GraduationCap
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { navigationSections } from '@/config/navigation';
import { getUser, logout } from '@/services/auth-service';
import { cn } from '@/lib/utils';

function AppSidebar({
  activeItem,
  onItemSelect,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser() || {};
  const isAdmin = user?.role === 'ADMIN';

  const handleNavigate = (path, key) => {
    navigate(path);
    onItemSelect?.(key);
    onMobileClose?.();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isCurrentActive = (item) => {
    if (location.pathname === item.path) return true;
    if (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) return true;
    if (item.key === activeItem) return true;
    return false;
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/90 bg-white dark:border-slate-800/90 dark:bg-slate-900 transition-all duration-300 shadow-xs',
          'w-72',
          collapsed ? 'md:w-20' : 'md:w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-4">
          <div className={cn('flex items-center gap-3', collapsed && 'md:justify-center md:w-full')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Building className="h-5 w-5" />
            </div>
            <div className={cn(collapsed && 'md:hidden')}>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">HostelOS</span>
                <span className="rounded-md bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                  {isAdmin ? 'ADMIN' : 'STUDENT'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">University Mess & Hostel</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="iconSm"
            className="md:hidden text-slate-500"
            onClick={onMobileClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {navigationSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isCurrentActive(item);

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavigate(item.path, item.key)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                      collapsed ? 'md:justify-center' : 'md:justify-start',
                      active
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-105', active ? 'text-white' : 'text-slate-500 dark:text-slate-400')} />
                    <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Profile & Collapse Section */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 p-3 space-y-2">
          {/* User Snippet */}
          <div
            onClick={() => handleNavigate('/profile', 'profile')}
            role="button"
            tabIndex={0}
            className={cn(
              'flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer',
              collapsed && 'md:justify-center'
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs">
              {(user?.email || 'ST').slice(0, 2).toUpperCase()}
            </div>
            <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || user?.email?.split('@')[0] || 'Student'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {user?.email || 'student@university.edu'}
              </p>
            </div>
          </div>

          {/* Desktop Collapse Toggle */}
          <div className="hidden md:flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <Button
              variant="ghost"
              size="sm"
              className={cn('w-full text-slate-500 hover:text-slate-900 text-xs font-medium', collapsed && 'px-0 justify-center')}
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronsLeft className="h-4 w-4 mr-2" />
                  Collapse
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AppSidebar;
