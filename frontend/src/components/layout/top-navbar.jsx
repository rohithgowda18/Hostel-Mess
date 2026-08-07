import { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, Moon, Search, Settings, Sun, UserRound, Check, Trash, Monitor } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  if (!name || typeof name !== 'string') {
    return 'HM';
  }
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
  const displayName = user?.name || user?.email || 'Hostel User';
  const displayRole = user?.role || 'STUDENT';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const list = await messApi.getNotifications();
      setNotifications(list || []);
      const countData = await messApi.getUnreadNotificationCount();
      setUnreadCount(countData.count || 0);
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
        'fixed right-0 top-0 z-20 h-16 border-b border-[#c2c6d4] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-xs transition-colors duration-200',
        collapsed ? 'md:left-20' : 'md:left-64',
        'left-0'
      )}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex flex-1 items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden text-[#424752] dark:text-[#CBD5E1]" onClick={onOpenSidebar}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="text-xl font-bold text-[#003f87] dark:text-[#3B82F6] hidden md:block">MessMaster</div>

          <div className="relative w-full max-w-md hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#424752] dark:text-[#94A3B8] text-sm">
              search
            </span>
            <input
              aria-label="Global search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search menu, hostels..."
              className="w-full bg-[#f3f4f5] dark:bg-[#0F172A] border-b-2 border-[#c2c6d4] dark:border-[#334155] hover:border-[#727784] dark:hover:border-[#94A3B8] focus:border-[#003f87] dark:focus:border-[#3B82F6] focus:bg-white dark:focus:bg-[#1E293B] rounded-t-md py-1.5 pl-9 pr-4 text-sm text-[#191c1d] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <InstallButton />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Notifications"
                variant="ghost"
                size="icon"
                className="relative rounded-full hover:bg-[#f3f4f5] dark:hover:bg-[#334155] text-[#424752] dark:text-[#CBD5E1]"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] dark:bg-[#EF4444]" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto bg-white dark:bg-[#1E293B] border-[#c2c6d4] dark:border-[#334155] p-2 space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-[#191c1d] dark:text-[#F8FAFC]">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-[#003f87] dark:text-[#3B82F6] hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator className="bg-[#e1e3e4] dark:bg-[#334155]" />
              {notifications.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#424752] dark:text-[#94A3B8]">No notifications</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start justify-between gap-2 p-2 rounded-lg text-xs hover:bg-[#f3f4f5] dark:hover:bg-[#334155] transition-colors',
                      !notif.isRead && 'bg-[#bbd0ff]/20 dark:bg-[#3B82F6]/10 border-l-2 border-[#003f87] dark:border-[#3B82F6]'
                    )}
                  >
                    <div className="flex-1 space-y-0.5">
                      <p className="font-semibold text-[#191c1d] dark:text-[#F8FAFC]">{notif.title}</p>
                      <p className="text-[#424752] dark:text-[#CBD5E1]">{notif.message}</p>
                    </div>
                    <div className="flex gap-1">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-1 rounded hover:bg-[#e1e3e4] dark:hover:bg-[#334155] text-[#006e25] dark:text-[#22C55E]"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotif(notif.id)}
                        className="p-1 rounded hover:bg-[#e1e3e4] dark:hover:bg-[#334155] text-[#ba1a1a] dark:text-[#EF4444]"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Selector Dropdown (Light / Dark / System) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-[#424752] dark:text-[#CBD5E1] hover:bg-[#f3f4f5] dark:hover:bg-[#334155]" aria-label="Theme mode">
                {effectiveTheme === 'dark' ? <Moon className="h-4 w-4 text-[#3B82F6]" /> : <Sun className="h-4 w-4 text-amber-500" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-[#1E293B] border-[#c2c6d4] dark:border-[#334155] text-[#191c1d] dark:text-[#F8FAFC]">
              <DropdownMenuItem onClick={() => setThemeMode('light')} className={cn('flex items-center gap-2 cursor-pointer', themeMode === 'light' && 'font-bold text-[#003f87] dark:text-[#3B82F6]')}>
                <Sun className="h-4 w-4 text-amber-500" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThemeMode('dark')} className={cn('flex items-center gap-2 cursor-pointer', themeMode === 'dark' && 'font-bold text-[#003f87] dark:text-[#3B82F6]')}>
                <Moon className="h-4 w-4 text-[#3B82F6]" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThemeMode('system')} className={cn('flex items-center gap-2 cursor-pointer', themeMode === 'system' && 'font-bold text-[#003f87] dark:text-[#3B82F6]')}>
                <Monitor className="h-4 w-4 text-[#424752] dark:text-[#CBD5E1]" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-[1px] bg-[#c2c6d4] dark:bg-[#334155] mx-1 hidden sm:block" />

          <button
            onClick={onLogout}
            className="text-xs font-semibold text-[#003f87] dark:text-[#3B82F6] hover:bg-[#0056b3]/10 dark:hover:bg-[#3B82F6]/10 px-3 py-1.5 rounded-full transition-colors hidden sm:block"
          >
            Logout
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-[#c2c6d4] dark:border-[#334155] p-0.5 transition-opacity hover:opacity-80 ml-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#0056b3] dark:bg-[#3B82F6] text-white font-bold text-xs">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-[#1E293B] border-[#c2c6d4] dark:border-[#334155]">
              <DropdownMenuLabel className="text-[#191c1d] dark:text-[#F8FAFC]">
                <p className="font-semibold">{displayName}</p>
                <p className="text-xs font-normal text-[#424752] dark:text-[#94A3B8]">{displayRole}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#e1e3e4] dark:bg-[#334155]" />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="dark:text-[#F8FAFC] dark:hover:bg-[#334155]">
                <UserRound className="mr-2 h-4 w-4 text-[#424752] dark:text-[#CBD5E1]" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')} className="dark:text-[#F8FAFC] dark:hover:bg-[#334155]">
                <Settings className="mr-2 h-4 w-4 text-[#424752] dark:text-[#CBD5E1]" />
                Settings & Theme
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e1e3e4] dark:bg-[#334155]" />
              <DropdownMenuItem onClick={onLogout} className="text-[#ba1a1a] dark:text-[#EF4444] dark:hover:bg-[#334155]">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
