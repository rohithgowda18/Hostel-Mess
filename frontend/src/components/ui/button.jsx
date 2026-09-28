import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 dark:focus-visible:ring-teal-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 shadow-xs dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400',
        primary:
          'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 shadow-xs dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400',
        secondary:
          'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700',
        outline:
          'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        danger:
          'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500',
        verified:
          'bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-500'
      },
      size: {
        xs: 'h-8 px-2.5 text-xs rounded-lg',
        sm: 'h-9 px-3 text-xs rounded-lg',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
        iconSm: 'h-8 w-8 p-0 rounded-lg'
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
