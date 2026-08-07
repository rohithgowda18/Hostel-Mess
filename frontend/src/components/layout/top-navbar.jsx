import { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, Moon, Search, Settings, Sun, UserRound, Check, Trash } from 'lucide-react';
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
  const { theme, toggleTheme } = useTheme();
  const displayName = user.name || user.email || 'Hostel User';
  const displayRole = user.role || 'STUDENT';

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
        'fixed right-0 top-0 z-20 h-16 border-b border-[#c2c6d4] bg-white shadow-xs',
        collapsed ? 'md:left-20' : 'md:left-64',
        'left-0'
      )}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex flex-1 items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden text-[#424752]" onClick={onOpenSidebar}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="text-xl font-bold text-[#003f87] hidden md:block">MessMaster</div>

          <div className="relative w-full max-w-md hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#424752] text-sm">
              search
            </span>
            <input
              aria-label="Global search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search menu, hostels..."
              className="w-full bg-[#f3f4f5] border-b-2 border-[#c2c6d4] hover:border-[#727784] focus:border-[#003f87] focus:bg-white rounded-t-md py-1.5 pl-9 pr-4 text-sm text-[#191c1d] outline-none transition-all"
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
                className="relative rounded-full hover:bg-[#f3f4f5] text-[#424752]"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a]" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto bg-white border-[#c2c6d4] p-2 space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-[#191c1d]">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-[#003f87] hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator className="bg-[#e1e3e4]" />
              {notifications.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#424752]">No notifications</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start justify-between gap-2 p-2 rounded-lg text-xs hover:bg-[#f3f4f5] transition-colors',
                      !notif.isRead && 'bg-[#bbd0ff]/20 border-l-2 border-[#003f87]'
                    )}
                  >
                    <div className="flex-1 space-y-0.5">
                      <p className="font-semibold text-[#191c1d]">{notif.title}</p>
                      <p className="text-[#424752]">{notif.message}</p>
                    </div>
                    <div className="flex gap-1">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-1 rounded hover:bg-[#e1e3e4] text-[#006e25]"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotif(notif.id)}
                        className="p-1 rounded hover:bg-[#e1e3e4] text-[#ba1a1a]"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-[#424752]" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="h-6 w-[1px] bg-[#c2c6d4] mx-1 hidden sm:block" />

          <button
            onClick={onLogout}
            className="text-xs font-semibold text-[#003f87] hover:bg-[#0056b3]/10 px-3 py-1.5 rounded-full transition-colors hidden sm:block"
          >
            Logout
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-[#c2c6d4] p-0.5 transition-opacity hover:opacity-80 ml-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#0056b3] text-white font-bold text-xs">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-[#c2c6d4]">
              <DropdownMenuLabel className="text-[#191c1d]">
                <p className="font-semibold">{displayName}</p>
                <p className="text-xs font-normal text-[#424752]">{displayRole}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#e1e3e4]" />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <UserRound className="mr-2 h-4 w-4 text-[#424752]" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Settings className="mr-2 h-4 w-4 text-[#424752]" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e1e3e4]" />
              <DropdownMenuItem onClick={onLogout} className="text-[#ba1a1a]">
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

