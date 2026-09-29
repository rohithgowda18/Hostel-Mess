import { Inbox, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records available',
  description = 'There are no active records matching your view at this time.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className
}) {
  return (
    <div className={cn('py-12 px-4 text-center space-y-3 max-w-sm mx-auto flex flex-col items-center justify-center', className)}>
      <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-center text-primary shadow-xs">
        <Icon className="h-7 w-7 text-primary" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-on-surface tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        )}
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {actionLabel && onAction && (
            <Button
              variant="default"
              size="sm"
              onClick={onAction}
              className="bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold h-8 px-4 cursor-pointer"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSecondaryAction}
              className="border-outline-variant/30 text-on-surface hover:bg-surface-container text-xs font-semibold h-8 px-3 cursor-pointer"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
