import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import AppSidebar from '@/components/layout/app-sidebar';
import TopNavbar from '@/components/layout/top-navbar';
import { sidebarItems } from '@/config/navigation';
import { cn } from '@/lib/utils';

function DashboardLayout({ user, onLogout, children }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync activeItem with current route and query parameters
  useEffect(() => {
    if (location.pathname.startsWith('/groups')) {
      setActiveItem('groups');
    } else if (location.pathname.startsWith('/dashboard')) {
      // Check if there's a tab query parameter
      const tab = searchParams.get('tab');
      if (tab) {
        setActiveItem(tab);
      } else {
        setActiveItem('dashboard');
      }
    }
  }, [location, searchParams]);

  const page = isValidElement(children)
    ? cloneElement(children, {
        activeItem,
        searchQuery
      })
    : children;

  return (
    <div className="min-h-screen bg-background text-foreground">
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
          'min-h-screen px-4 pb-8 pt-24 transition-all md:px-6',
          collapsed ? 'md:pl-24' : 'md:pl-[19rem]'
        )}
      >
        <div className="mx-auto w-full max-w-7xl">{page}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;
