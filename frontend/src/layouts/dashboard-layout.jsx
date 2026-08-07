import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/app-sidebar';
import TopNavbar from '@/components/layout/top-navbar';
import { sidebarItems } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { messApi } from '@/services/mess-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Search, Calendar, Users, MessageSquare, User } from 'lucide-react';

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

  // Sync activeItem with current route and query parameters
  useEffect(() => {
    if (location.pathname.startsWith('/groups')) {
      setActiveItem('groups');
    } else if (location.pathname.startsWith('/student-photos')) {
      setActiveItem('student-photos');
    } else if (location.pathname.startsWith('/dashboard')) {
      const tab = searchParams.get('tab');
      if (tab) {
        setActiveItem(tab);
      } else {
        setActiveItem('dashboard');
      }
    } else if (location.pathname.startsWith('/history')) {
      setActiveItem('history');
    } else if (location.pathname.startsWith('/meals')) {
      setActiveItem('meals');
    } else if (location.pathname.startsWith('/directory')) {
      setActiveItem('directory');
    } else if (location.pathname.startsWith('/qr-checkin')) {
      setActiveItem('qr-checkin');
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
            <mark key={i} className="bg-amber-400 text-slate-950 font-semibold px-0.5 rounded">
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
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0F172A] text-[#191c1d] dark:text-[#F8FAFC] transition-colors duration-200">
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
          'min-h-screen px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-16 transition-all md:px-6 md:pb-8 md:pt-24',
          collapsed ? 'md:pl-24' : 'md:pl-[19rem]'
        )}
      >
        <div className="mx-auto w-full max-w-7xl relative">
          {/* Universal Search Results Overlay */}
          {searchQuery.trim() !== '' && (
            <div className="absolute inset-x-0 top-0 z-50 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur border border-[#c2c6d4] dark:border-[#334155] rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-[#c2c6d4] dark:border-[#334155] pb-3">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-[#003f87] dark:text-[#3B82F6]" />
                  <h2 className="text-xl font-bold text-[#191c1d] dark:text-[#F8FAFC]">Search Results for "{searchQuery}"</h2>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#334155] text-[#424752] dark:text-[#CBD5E1]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {searchLoading ? (
                <div className="py-20 text-center text-[#424752] dark:text-[#94A3B8] text-sm">Searching the mess database...</div>
              ) : searchResults ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Matched Meals */}
                  <Card className="bg-white dark:bg-[#0F172A] border-[#c2c6d4] dark:border-[#334155]">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#191c1d] dark:text-[#F8FAFC]">
                        <Calendar className="h-4 w-4 text-[#003f87] dark:text-[#3B82F6]" /> Menus & Meals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {searchResults.meals?.length === 0 ? (
                        <p className="text-xs text-[#424752] dark:text-[#94A3B8]">No matching menus</p>
                      ) : (
                        searchResults.meals?.map((meal) => (
                          <div key={meal.id} className="text-xs border-b border-[#c2c6d4]/40 dark:border-[#334155] pb-2 last:border-0">
                            <div className="flex justify-between font-semibold mb-0.5 text-[#191c1d] dark:text-[#F8FAFC]">
                              <span>{meal.mealType}</span>
                              <span className="text-[#424752] dark:text-[#94A3B8]">{meal.date}</span>
                            </div>
                            <p className="text-[#424752] dark:text-[#CBD5E1]">
                              {highlightText(meal.items?.join(', '), searchQuery)}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Matched Groups */}
                  <Card className="bg-white dark:bg-[#0F172A] border-[#c2c6d4] dark:border-[#334155]">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#191c1d] dark:text-[#F8FAFC]">
                        <Users className="h-4 w-4 text-[#003f87] dark:text-[#3B82F6]" /> Buddy Groups
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {searchResults.groups?.length === 0 ? (
                        <p className="text-xs text-[#424752] dark:text-[#94A3B8]">No matching groups</p>
                      ) : (
                        searchResults.groups?.map((group) => (
                          <div
                            key={group.id}
                            onClick={() => {
                              setSearchQuery('');
                              navigate(`/groups/${group.id || group._id}`);
                            }}
                            className="text-xs border-b border-[#c2c6d4]/40 dark:border-[#334155] pb-2 last:border-0 cursor-pointer hover:text-[#003f87] dark:hover:text-[#3B82F6] transition-colors"
                          >
                            <p className="font-semibold text-[#191c1d] dark:text-[#F8FAFC]">{highlightText(group.name, searchQuery)}</p>
                            <p className="text-[#424752] dark:text-[#94A3B8]">Code: {highlightText(group.groupCode, searchQuery)}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Matched Complaints */}
                  <Card className="bg-white dark:bg-[#0F172A] border-[#c2c6d4] dark:border-[#334155]">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#191c1d] dark:text-[#F8FAFC]">
                        <MessageSquare className="h-4 w-4 text-[#003f87] dark:text-[#3B82F6]" /> Complaints
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {searchResults.complaints?.length === 0 ? (
                        <p className="text-xs text-[#424752] dark:text-[#94A3B8]">No matching complaints</p>
                      ) : (
                        searchResults.complaints?.map((comp) => (
                          <div key={comp.id} className="text-xs border-b border-[#c2c6d4]/40 dark:border-[#334155] pb-2 last:border-0">
                            <div className="flex justify-between font-semibold mb-0.5 text-[#191c1d] dark:text-[#F8FAFC]">
                              <span>{highlightText(comp.foodItem, searchQuery)}</span>
                              <Badge variant="secondary" className="text-[9px]">{comp.status}</Badge>
                            </div>
                            <p className="text-[#424752] dark:text-[#94A3B8]">Meal: {comp.mealType} | Date: {comp.date}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Matched Students */}
                  <Card className="bg-white dark:bg-[#0F172A] border-[#c2c6d4] dark:border-[#334155]">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#191c1d] dark:text-[#F8FAFC]">
                        <User className="h-4 w-4 text-[#003f87] dark:text-[#3B82F6]" /> Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {searchResults.users?.length === 0 ? (
                        <p className="text-xs text-[#424752] dark:text-[#94A3B8]">No matching students</p>
                      ) : (
                        searchResults.users?.map((st) => (
                          <div key={st.id} className="text-xs border-b border-[#c2c6d4]/40 dark:border-[#334155] pb-2 last:border-0">
                            <p className="font-semibold text-[#191c1d] dark:text-[#F8FAFC]">{highlightText(st.email, searchQuery)}</p>
                            <p className="text-[#424752] dark:text-[#94A3B8]">
                              Hostel: {st.hostel} | Branch: {st.branch}
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

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1E293B] border-t border-[#c2c6d4] dark:border-[#334155] flex items-center justify-around min-h-[4rem] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-1 transition-colors duration-200">
        {[
          { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
          { label: 'Meals', path: '/meals', icon: 'restaurant' },
          { label: 'Check In', path: '/qr-checkin', icon: 'qr_code_scanner', isHero: true },
          { label: 'Gallery', path: '/student-photos', icon: 'photo_library' },
          { label: 'Profile', path: '/profile', icon: 'person' },
        ].map((item) => {
          const isActive = location.pathname === item.path;
          if (item.isHero) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center relative -top-3 active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-[#006e25] dark:bg-[#22C55E] text-white dark:text-slate-950 flex items-center justify-center shadow-lg shadow-[#006e25]/30 dark:shadow-[#22C55E]/30 border-2 border-white dark:border-[#1E293B]">
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <span className="text-[10px] font-bold text-[#006e25] dark:text-[#22C55E] mt-0.5">{item.label}</span>
              </button>
            );
          }
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95',
                isActive ? 'text-[#003f87] dark:text-[#3B82F6] font-bold' : 'text-[#424752] dark:text-[#CBD5E1] hover:text-[#003f87] dark:hover:text-[#3B82F6]'
              )}
            >
              <span className={cn('material-symbols-outlined text-2xl', isActive && 'font-black')}>{item.icon}</span>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default DashboardLayout;
