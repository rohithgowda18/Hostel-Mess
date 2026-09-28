import { cn } from '@/lib/utils';

export function PageHeader({
  badge,
  title,
  description,
  actions,
  className
}) {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8', className)}>
      <div className="space-y-1">
        {badge && <div className="mb-2">{badge}</div>}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
