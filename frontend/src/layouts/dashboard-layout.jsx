import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/app-sidebar';
import TopNavbar from '@/components/layout/top-navbar';
import { sidebarItems } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { messApi } from '@/services/mess-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Search,
  Calendar,
  Users,
  MessageSquare,
  User,
  LayoutDashboard,
  UtensilsCrossed,
  Building2,
  QrCode,
  MoreHorizontal
} from 'lucide-react';

function DashboardLayout({ user, onLogout, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Sync activeItem with current route and query parameters
  useEffect(() => {
    setMoreOpen(false);
    if (location.pathname.startsWith('/groups')) {
      setActiveItem('groups');
    } else if (location.pathname.startsWith('/student-photos')) {
      setActiveItem('student-photos');
    } else if (location.pathname.startsWith('/dashboard')) {
      const tab = searchParams.get('tab');
      setActiveItem(tab || 'dashboard');
    } else if (location.pathname.startsWith('/meals')) {
      setActiveItem('meals');
    } else if (location.pathname.startsWith('/directory')) {
      setActiveItem('directory');
    } else if (location.pathname.startsWith('/qr-checkin')) {
      setActiveItem('qr-checkin');
    } else if (location.pathname.startsWith('/feedback')) {
      setActiveItem('feedback');
    } else if (location.pathname.startsWith('/profile')) {
      setActiveItem('profile');
    }
  }, [location, searchParams]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await messApi.searchUniversal(searchQuery);
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const page = isValidElement(children)
    ? cloneElement(children, {
        activeItem,
        searchQuery
      })
    : children;

  const highlightText = (text, highlight) => {
    if (!text) return '';
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 text-slate-950 font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <AppSidebar
        items={sidebarItems}
        activeItem={activeItem}
        onItemSelect={setActiveItem}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <TopNavbar
        collapsed={collapsed}
        onOpenSidebar={() => setMobileOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={user}
        onLogout={onLogout}
      />

      <main
        className={cn(
          'min-h-screen px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-16 transition-all duration-300 md:px-6 md:pb-8 md:pt-20',
          collapsed ? 'md:pl-20' : 'md:pl-72'
        )}
      >
        <div className="mx-auto w-full max-w-7xl relative">
          {/* Universal Search Results Overlay */}
          {searchQuery.trim() !== '' && (
            <div className="absolute inset-x-0 top-0 z-50 max-h-[80vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-dropdown space-y-6 overscroll-contain animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Results for "{searchQuery}"
                  </h2>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {searchLoading ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  Searching dishes, rooms, students, and groups...
                </div>
              ) : searchResults ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Matched Meals */}
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="py-3">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Menus & Meals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {searchResults.meals?.length === 0 ? (
                        <p className="text-xs text-slate-400">No matching meals</p>
                      ) : (
                        searchResults.meals?.map((meal) => (
                          <div key={meal.id} className="text-xs border-b border-slate-100 dark:border-slate-800/60 pb-2 last:border-0">
                            <div className="flex justify-between font-semibold mb-0.5 text-slate-800 dark:text-slate-200">
                              <span>{meal.mealType}</span>
                              <span className="text-slate-400">{meal.date}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">
                              {highlightText(meal.items?.join(', '), searchQuery)}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Matched Groups */}
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="py-3">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Buddy Groups
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {searchResults.groups?.length === 0 ? (
                        <p className="text-xs text-slate-400">No matching groups</p>
                      ) : (
                        searchResults.groups?.map((group) => (
                          <div
                            key={group.id || group._id}
                            onClick={() => {
                              setSearchQuery('');
                              navigate(`/groups/${group.id || group._id}`);
                            }}
                            className="text-xs border-b border-slate-100 dark:border-slate-800/60 pb-2 last:border-0 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {highlightText(group.name, searchQuery)}
                            </p>
                            <p className="text-slate-400">Code: {highlightText(group.groupCode, searchQuery)}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Matched Complaints */}
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="py-3">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Feedback Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {searchResults.complaints?.length === 0 ? (
                        <p className="text-xs text-slate-400">No matching reports</p>
                      ) : (
                        searchResults.complaints?.map((comp) => (
                          <div key={comp.id} className="text-xs border-b border-slate-100 dark:border-slate-800/60 pb-2 last:border-0">
                            <div className="flex justify-between font-semibold mb-0.5 text-slate-800 dark:text-slate-200">
                              <span>{highlightText(comp.foodItem, searchQuery)}</span>
                              <Badge variant="neutral" className="text-[9px]">{comp.status}</Badge>
                            </div>
                            <p className="text-slate-400">Slot: {comp.mealType} | Date: {comp.date}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Matched Students */}
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="py-3">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Hostel Residents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {searchResults.users?.length === 0 ? (
                        <p className="text-xs text-slate-400">No matching students</p>
                      ) : (
                        searchResults.users?.map((st) => (
                          <div key={st.id} className="text-xs border-b border-slate-100 dark:border-slate-800/60 pb-2 last:border-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{highlightText(st.email, searchQuery)}</p>
                            <p className="text-slate-400">
                              Hostel: {st.hostel || 'Main'} | Branch: {st.branch || 'General'}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
          )}

          {page}
        </div>
      </main>

      {/* Mobile Drawer "More" Dropup */}
      {moreOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="md:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setMoreOpen(false)}
        />
      )}
      {moreOpen && (
        <div className="md:hidden fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-dropdown p-2 space-y-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
          {[
            { label: 'Hostel & Rooms', path: '/directory', icon: Building2 },
            { label: 'Feedback & Reports', path: '/feedback', icon: MessageSquare },
            { label: 'Food Gallery', path: '/student-photos', icon: Calendar },
            { label: 'My Profile & Settings', path: '/profile', icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  setMoreOpen(false);
                  navigate(item.path);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 flex items-stretch justify-around min-h-[4rem] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-1">
        {[
          { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Meals', path: '/meals', icon: UtensilsCrossed },
          { label: 'Check In', path: '/qr-checkin', icon: QrCode, isHero: true },
          { label: 'Groups', path: '/groups', icon: Users },
          { label: 'More', icon: MoreHorizontal, isMore: true },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = item.path ? location.pathname === item.path : moreOpen;

          if (item.isHero) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-label="QR check-in"
                className="flex flex-col items-center justify-center relative -top-3 active:scale-95 transition-transform min-w-[64px]"
              >
                <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 border-2 border-white dark:border-slate-900">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">{item.label}</span>
              </button>
            );
          }

          if (item.isMore) {
            return (
              <button
                key="more"
                onClick={() => setMoreOpen((v) => !v)}
                aria-label="More navigation options"
                aria-expanded={moreOpen}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 min-h-[56px] py-1 transition-colors active:scale-95',
                  isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-h-[56px] py-1 transition-colors active:scale-95',
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default DashboardLayout;
