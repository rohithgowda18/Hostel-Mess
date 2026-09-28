import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef(({ className, hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-xs transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-slate-100',
      hover && 'hover:shadow-card-hover hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5',
      className
    )}
    {...props}
  />
));

Card.displayName = 'Card';

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1 p-5 md:p-6', className)} {...props} />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100', className)} {...props} />
));

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs font-medium text-slate-500 dark:text-slate-400', className)} {...props} />
));

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 md:p-6 pt-0 md:pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-5 md:p-6 pt-0 md:pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-auto', className)} {...props} />
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
