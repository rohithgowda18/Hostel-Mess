import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/50 bg-primary/15 text-indigo-300',
        success: 'border-success/40 bg-success/20 text-emerald-300',
        warning: 'border-warning/40 bg-warning/20 text-amber-200',
        danger: 'border-danger/40 bg-danger/20 text-red-200',
        neutral: 'border-border bg-slate-800/60 text-muted'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
