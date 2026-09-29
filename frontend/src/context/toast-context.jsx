import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, description = '', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast = { id, type, message, description };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg, desc, dur) => addToast('success', msg, desc, dur),
      error: (msg, desc, dur) => addToast('error', msg, desc, dur),
      info: (msg, desc, dur) => addToast('info', msg, desc, dur),
      warning: (msg, desc, dur) => addToast('warning', msg, desc, dur),
      remove: removeToast
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5',
                isSuccess && 'bg-surface-container-lowest border-emerald-500/30 text-on-surface shadow-emerald-500/10',
                isError && 'bg-surface-container-lowest border-error/30 text-on-surface shadow-red-500/10',
                isWarning && 'bg-surface-container-lowest border-amber-500/30 text-on-surface shadow-amber-500/10',
                !isSuccess && !isError && !isWarning && 'bg-surface-container-lowest border-primary/30 text-on-surface shadow-primary/10'
              )}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                {isError && <AlertCircle className="h-4 w-4 text-error" />}
                {isWarning && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                {!isSuccess && !isError && !isWarning && <Info className="h-4 w-4 text-primary" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-bold leading-tight text-on-surface">{t.message}</p>
                {t.description && (
                  <p className="text-[11px] text-on-surface-variant leading-snug mt-0.5">{t.description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 text-on-surface-variant hover:text-on-surface rounded-md transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export default ToastProvider;
