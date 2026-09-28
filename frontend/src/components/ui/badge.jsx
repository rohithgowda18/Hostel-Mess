import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300',
        primary:
          'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300',
        secondary:
          'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
        verified:
          'border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300',
        success:
          'border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300',
        pending:
          'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        warning:
          'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        danger:
          'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
        error:
          'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
        info:
          'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300',
        neutral:
          'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
