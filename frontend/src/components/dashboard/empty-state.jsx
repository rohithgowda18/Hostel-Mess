import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

function EmptyState({
  title = 'No data available',
  description = 'Nothing to show right now.',
  actionLabel,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-soft">
      <div className="rounded-full border border-border bg-slate-800/50 p-3">
        <Inbox className="h-5 w-5 text-muted" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {actionLabel ? (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
