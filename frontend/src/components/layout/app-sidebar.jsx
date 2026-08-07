import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function AppSidebar({
  items,
  activeItem,
  onItemSelect,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose
}) {
  const navigate = useNavigate();
  const visibleItems = items;

  const handleItemClick = (item) => {
    switch (item.key) {
      case 'feedback':
        navigate('/feedback');
        break;
      case 'groups':
        navigate('/groups');
        break;
      case 'student-photos':
        navigate('/student-photos');
        break;
      case 'directory':
        navigate('/directory');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'meals':
        navigate('/meals');
        break;
      case 'qr-checkin':
        navigate('/qr-checkin');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      default:
        navigate(`/dashboard?tab=${item.key}`);
    }
    onItemSelect(item.key);
    onMobileClose();
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-[#191c1d]/60 dark:bg-black/80 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#e1e3e4] dark:border-[#334155] bg-[#f3f4f5] dark:bg-[#1E293B] transition-all duration-300',
          'w-64 md:w-64',
          collapsed ? 'md:w-20' : 'md:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#e1e3e4] dark:border-[#334155] px-4">
          <div className={cn('flex items-center gap-3', collapsed && 'md:justify-center md:w-full')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0056b3] dark:bg-[#3B82F6] text-white">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                school
              </span>
            </div>
            <div className={cn(collapsed && 'md:hidden')}>
              <h1 className="text-base font-extrabold text-[#003f87] dark:text-[#3B82F6]">Hostel Dining</h1>
              <p className="text-xs text-[#424752] dark:text-[#94A3B8]">Student Portal</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden text-[#424752] dark:text-[#CBD5E1]" onClick={onMobileClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:translate-x-0.5',
                  collapsed ? 'md:justify-center' : 'md:justify-start',
                  isActive
                    ? 'bg-[#80f98b] text-[#007327] dark:bg-[#22C55E] dark:text-slate-950 font-bold shadow-xs'
                    : 'text-[#424752] dark:text-[#CBD5E1] hover:bg-[#e1e3e4]/60 dark:hover:bg-[#334155] hover:text-[#191c1d] dark:hover:text-[#F8FAFC]'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden border-t border-[#e1e3e4] dark:border-[#334155] p-3 md:block">
          <Button
            variant="outline"
            className="w-full border-[#c2c6d4] dark:border-[#334155] text-[#424752] dark:text-[#CBD5E1] hover:bg-[#e1e3e4]/50 dark:hover:bg-[#334155]"
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4 mr-2" />
                Collapse Sidebar
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}

export default AppSidebar;
