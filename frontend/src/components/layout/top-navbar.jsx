import { useEffect, useState } from 'react';
import {
  Bell,
  LogOut,
  Moon,
  Sun,
  User,
  Check,
  X,
  Trash2,
  Monitor
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
import websocketService from '@/services/websocket-service';
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

  // Real-time WebSocket notifications subscription
  useEffect(() => {
    const userEmail = user?.email;
    if (!userEmail) return;

    // Request notification permission if supported
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { });
    }

    const unsubscribe = websocketService.subscribeToMyNotifications(userEmail, (notif) => {
      if (notif && (notif.id || notif.message)) {
        setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
        setUnreadCount((prev) => prev + 1);

        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(notif.title || 'Hostel Mess Alert', {
              body: notif.message || '',
              icon: '/favicon.ico'
            });
          } catch { }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.email]);

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

  const handleFriendRequestAction = async (notification, action) => {
    const requestId = notification.relatedId || notification.requestId || notification.friendshipId;
    if (!requestId) {
      navigate('/student/profile');
      return;
    }

    try {
      if (action === 'accept') {
        await messApi.acceptFriendRequest(requestId);
      } else {
        await messApi.rejectFriendRequest(requestId);
      }

      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
      if (!notification.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
      await messApi.deleteNotification(notification.id).catch(() => { });
    } catch (err) {
      console.error('Failed to update friend request:', err);
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
        'fixed right-0 top-0 z-30 h-16 border-b border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-all duration-300',
        collapsed ? 'md:left-20' : 'md:left-64',
        'left-0'
      )}
    >
      <div className="flex h-full items-center justify-between gap-3 px-4 md:px-6">
        {/* Left: Brand logo on mobile */}
        <div className="flex items-center gap-2">
          <span className="md:hidden text-sm font-bold text-primary tracking-tight">MessMaster</span>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3">




          <InstallButton />

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Notifications"
                variant="ghost"
                size="iconSm"
                className="relative rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto p-2 bg-surface-container-lowest border border-outline-variant/30 shadow-lg">
              <div className="flex items-center justify-between px-2.5 py-2 border-b border-outline-variant/20">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="py-1 space-y-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-on-surface-variant">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isMealCall = notif.type === 'MEAL_CALL' || notif.notificationType === 'MEAL_CALL';
                    const isFriendReq = notif.type === 'FRIEND_REQUEST' || notif.notificationType === 'FRIEND_REQUEST';
                    const isFriendAccepted = notif.type === 'FRIEND_REQUEST_ACCEPTED' || notif.notificationType === 'FRIEND_REQUEST_ACCEPTED';
                    const isGroupMsg = notif.type === 'GROUP_MESSAGE' || notif.type === 'CHAT_MESSAGE';

                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          'flex items-start justify-between gap-2.5 p-2.5 rounded-lg text-xs transition-colors cursor-pointer group',
                          !notif.isRead
                            ? 'bg-primary-fixed/25 border border-primary/30'
                            : 'hover:bg-surface-container-low border border-transparent'
                        )}
                        onClick={() => {
                          if (!notif.isRead) handleMarkAsRead(notif.id);
                          if (notif.link) navigate(notif.link);
                        }}
                      >
                        <div className="mt-0.5 shrink-0 text-base">
                          {isMealCall && '🍽️'}
                          {isFriendReq && <span className="material-symbols-outlined text-[18px] text-primary">person_add</span>}
                          {isFriendAccepted && <span className="material-symbols-outlined text-[18px] text-secondary">diversity_3</span>}
                          {isGroupMsg && <span className="material-symbols-outlined text-[18px] text-primary">chat</span>}
                          {!isMealCall && !isFriendReq && !isFriendAccepted && !isGroupMsg && (
                            <span className="material-symbols-outlined text-[18px] text-outline">notifications</span>
                          )}
                        </div>

                        <div className="flex-1 space-y-0.5 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-on-surface truncate">{notif.title}</p>
                            {notif.createdAt && (
                              <span className="text-[10px] text-outline font-mono shrink-0">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant leading-snug line-clamp-2">{notif.message}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
                          {isFriendReq ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleFriendRequestAction(notif, 'accept')}
                                title="Accept friend request"
                                className="p-1 rounded-md hover:bg-secondary-container/50 text-secondary"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFriendRequestAction(notif, 'reject')}
                                title="Reject friend request"
                                className="p-1 rounded-md hover:bg-error-container text-error"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : !notif.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(notif.id)}
                              title="Mark as read"
                              className="p-1 rounded-md hover:bg-secondary-container/50 text-secondary"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          {!isFriendReq && (
                            <button
                              type="button"
                              onClick={() => handleDeleteNotif(notif.id)}
                              title="Delete"
                              className="p-1 rounded-md hover:bg-error-container text-error"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
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
                className="rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                aria-label="Theme mode"
              >
                {effectiveTheme === 'dark' ? (
                  <Moon className="h-4 w-4 text-primary-fixed-dim" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-surface-container-lowest border border-outline-variant/30">
              <DropdownMenuItem onClick={() => setThemeMode('light')} className={cn(themeMode === 'light' && 'font-bold text-primary')}>
                <Sun className="h-4 w-4 text-amber-500" /> Light Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThemeMode('dark')} className={cn(themeMode === 'dark' && 'font-bold text-primary')}>
                <Moon className="h-4 w-4 text-primary-fixed-dim" /> Dark Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThemeMode('system')} className={cn(themeMode === 'system' && 'font-bold text-primary')}>
                <Monitor className="h-4 w-4 text-outline" /> System Preference
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-5 w-px bg-outline-variant/30 mx-1 hidden sm:block" />

          {/* User Account Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-surface-container cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-container text-on-primary font-bold text-xs">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-on-surface leading-tight">{displayName}</span>
                  <span className="text-[10px] text-on-surface-variant leading-none">{displayRole}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface-container-lowest border border-outline-variant/30">
              <DropdownMenuLabel>
                <p className="font-bold text-on-surface capitalize">{displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-on-surface-variant truncate">{user?.email}</span>
                  <Badge variant="neutral" className="text-[9px] px-1.5 py-0">
                    {displayRole}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-outline-variant/20" />
              <DropdownMenuItem onClick={() => navigate('/student/profile')} className="cursor-pointer">
                <User className="h-4 w-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/student/attendance')} className="cursor-pointer">
                <span className="material-symbols-outlined text-[16px] text-primary">qr_code_scanner</span> Dining Pass
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-outline-variant/20" />
              <DropdownMenuItem onClick={onLogout} className="text-error cursor-pointer">
                <LogOut className="h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>



    </header>
  );
}

export default TopNavbar;
