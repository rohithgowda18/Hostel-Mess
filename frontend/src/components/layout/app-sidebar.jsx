import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
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
  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-950/70 md:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card transition-all duration-300',
          'w-72 md:w-72',
          collapsed ? 'md:w-20' : 'md:w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-border px-4">
          <div className={cn('flex items-center gap-3', collapsed && 'md:justify-center md:w-full')}>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-card">HM</div>
            <div className={cn(collapsed && 'md:hidden')}>
              <p className="text-sm font-semibold text-foreground">Hostel Mess</p>
              <p className="text-xs text-muted">Management</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onItemSelect(item.key);
                  onMobileClose();
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
                  collapsed ? 'md:justify-center' : 'md:justify-start',
                  isActive
                    ? 'border-transparent bg-primary text-white shadow-card'
                    : 'border-transparent text-muted hover:border-border hover:bg-slate-800/40 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden border-t border-border p-3 md:block">
          <Button variant="secondary" className="w-full" onClick={onToggleCollapse}>
            {collapsed ? (
              <>
                <ChevronsRight className="h-4 w-4" />
                <span className="md:hidden">Expand Sidebar</span>
              </>
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
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
