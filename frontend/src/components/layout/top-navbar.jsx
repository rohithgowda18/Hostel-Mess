import { useEffect, useState } from 'react';
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Check,
  Trash2,
  Monitor,
  X,
  Building
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstallButton } from '@/components/InstallButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/utils';
import { messApi } from '@/services/mess-api';
import { useNavigate } from 'react-router-dom';

function initials(name) {
  if (!name || typeof name !== 'string') return 'HM';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function TopNavbar({ collapsed, onOpenSidebar, searchQuery, onSearchChange, user, onLogout }) {
  const navigate = useNavigate();
  const { themeMode, effectiveTheme, setThemeMode } = useTheme();
  const displayName = user?.name || user?.email?.split('@')[0] || 'Hostel User';
  const displayRole = user?.role || 'STUDENT';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const list = await messApi.getNotifications().catch(() => []);
      setNotifications(list || []);
      const countData = await messApi.getUnreadNotificationCount().catch(() => ({ count: 0 }));
      setUnreadCount(countData?.count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await messApi.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await messApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const notif = notifications.find((n) => n.id === id);
      if (notif && !notif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await messApi.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 shadow-xs transition-all duration-300',
        collapsed ? 'md:left-20' : 'md:left-72',
        'left-0'
      )}
    >
      <div className="flex h-full items-center justify-between gap-3 px-4 md:px-6">
        {/* Left: Mobile hamburger & Global Search input */}
        <div className="flex flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="iconSm"
            className="md:hidden text-slate-600 dark:text-slate-300"
            onClick={onOpenSidebar}
            aria-label="Open sidebar navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop Search Bar */}
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              aria-label="Global search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search dishes, rooms, groups, students..."
              className="w-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Search Icon Toggle */}
          <Button
            variant="ghost"
            size="iconSm"
            aria-label="Toggle mobile search"
            className="sm:hidden text-slate-600 dark:text-slate-300"
            onClick={() => setMobileSearchOpen((v) => !v)}
          >
            <Search className="h-4 w-4" />
          </Button>

          <InstallButton />

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Notifications"
                variant="ghost"
                size="iconSm"
                className="relative rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto p-2">
              <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="py-1 space-y-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'flex items-start justify-between gap-2 p-2.5 rounded-xl text-xs transition-colors',
                        !notif.isRead
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className="flex-1 space-y-0.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{notif.message}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            title="Mark as read"
                            className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-600"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotif(notif.id)}
                          title="Delete"
                          className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="iconSm"
                className="rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Theme mode"
              >
                {effectiveTheme === 'dark' ? (
                  <Moon className="h-4 w-4 text-blue-400" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setThemeMode('light')} className={cn(themeMode === 'light' && 'font-bold text-blue-600 dark:text-blue-400')}>
                <Sun className="h-4 w-4 text-amber-500" /> Light Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThemeMode('dark')} className={cn(themeMode === 'dark' && 'font-bold text-blue-600 dark:text-blue-400')}>
                <Moon className="h-4 w-4 text-blue-400" /> Dark Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThemeMode('system')} className={cn(themeMode === 'system' && 'font-bold text-blue-600 dark:text-blue-400')}>
                <Monitor className="h-4 w-4 text-slate-400" /> System Preference
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* User Account Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-bold text-slate-900 dark:text-slate-100 capitalize">{displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</span>
                  <Badge variant="neutral" className="text-[9px] px-1.5 py-0">
                    {displayRole}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="h-4 w-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Settings className="h-4 w-4" /> Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-rose-600 dark:text-rose-400">
                <LogOut className="h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {mobileSearchOpen && (
        <div className="sm:hidden absolute inset-x-0 top-16 z-30 border-b border-slate-200 bg-white p-3 shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              autoFocus
              aria-label="Global search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search dishes, rooms, groups..."
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-9 text-sm text-slate-900 dark:text-slate-100 outline-none"
            />
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                onSearchChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default TopNavbar;
