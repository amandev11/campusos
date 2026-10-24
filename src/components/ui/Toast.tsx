import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { makeId } from '@/lib/ids';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  push: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, typeof Info> = {
  success: CircleCheck,
  error: TriangleAlert,
  info: Info,
};

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'border-ok/35',
  error: 'border-danger/40',
  info: 'border-line',
};

const ICON_CLASS: Record<ToastTone, string> = {
  success: 'text-ok',
  error: 'text-danger',
  info: 'text-teal',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());
  const reduced = useReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback<ToastContextValue['push']>(
    (toast) => {
      const id = makeId('toast');
      setToasts((current) => [...current.slice(-2), { ...toast, id }]);
      const timer = window.setTimeout(() => dismiss(id), toast.tone === 'error' ? 7000 : 4800);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, description) => push({ tone: 'success', title, description }),
      error: (title, description) => push({ tone: 'error', title, description }),
      info: (title, description) => push({ tone: 'info', title, description }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          role="region"
          aria-label="Notifications"
          className="safe-bottom pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end sm:px-0"
        >
          <div aria-live="polite" aria-atomic="false" className="flex w-full max-w-sm flex-col gap-2">
            <AnimatePresence initial={false}>
              {toasts.map((toast) => {
                const Icon = ICONS[toast.tone];
                return (
                  <motion.div
                    key={toast.id}
                    layout
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
                    animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      'glass-surface glass-float pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3',
                      TONE_CLASS[toast.tone],
                    )}
                  >
                    <Icon className={cn('mt-0.5 size-4 shrink-0', ICON_CLASS[toast.tone])} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8125rem] font-medium text-fg">{toast.title}</p>
                      {toast.description ? (
                        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{toast.description}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(toast.id)}
                      aria-label="Dismiss notification"
                      className="text-fg-subtle transition-colors hover:text-fg"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
