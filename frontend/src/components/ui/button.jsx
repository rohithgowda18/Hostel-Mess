import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-white hover:bg-indigo-500 shadow-card',
        secondary: 'border-border bg-card text-foreground hover:border-primary/60 hover:text-white hover:bg-primary/80',
        outline: 'border-border bg-transparent text-foreground hover:border-primary hover:text-primary',
        ghost: 'border-transparent bg-transparent text-muted hover:bg-slate-700/50 hover:text-foreground',
        success: 'border-transparent bg-success text-white hover:bg-emerald-500',
        warning: 'border-transparent bg-warning text-slate-900 hover:bg-amber-400',
        danger: 'border-transparent bg-danger text-white hover:bg-red-500'
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

const Button = forwardRef(({ className, variant, size, type = 'button', ...props }, ref) => {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});

Button.displayName = 'Button';

export { Button };
