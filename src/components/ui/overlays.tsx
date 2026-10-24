import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, IconButton } from './primitives';

/* ============================================================== dialog logic */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useDialogBehaviour(open: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      const node = containerRef.current;
      if (!node) return;
      const target = node.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? node).focus();
    }, 40);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const node = containerRef.current;
      if (!node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (item) => item.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  return containerRef;
}

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 bg-overlay backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

/* ===================================================================== modal */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Renders as a bottom sheet below the `sm` breakpoint. */
  sheetOnMobile?: boolean;
}

const MODAL_SIZE = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  sheetOnMobile = true,
}: ModalProps) {
  const containerRef = useDialogBehaviour(open, onClose);
  const reduced = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();

  const panelMotion = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : sheetOnMobile
      ? {
          initial: { opacity: 0, y: 28, scale: 0.99 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 20, scale: 0.99 },
        }
      : {
          initial: { opacity: 0, y: 14, scale: 0.985 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 10, scale: 0.99 },
        };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <Backdrop onClose={onClose} />
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            {...panelMotion}
            transition={{ duration: reduced ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'glass-surface relative flex max-h-[92dvh] w-full flex-col outline-none',
              sheetOnMobile ? 'glass-sheet rounded-t-3xl sm:glass-modal sm:rounded-2xl' : 'glass-modal m-4 rounded-2xl',
              MODAL_SIZE[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id={titleId} className="display text-xl text-fg">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              <IconButton label="Close dialog" size="sm" onClick={onClose}>
                <X className="size-4" aria-hidden="true" />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
            {footer ? (
              <div className="safe-bottom flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

/* ===================================================================== sheet */

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left' | 'bottom';
}) {
  const containerRef = useDialogBehaviour(open, onClose);
  const reduced = useReducedMotion();
  const titleId = useId();

  const offset = side === 'bottom' ? { y: '100%' } : side === 'left' ? { x: '-100%' } : { x: '100%' };
  const position =
    side === 'bottom'
      ? 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl'
      : side === 'left'
        ? 'left-0 top-0 h-full w-full max-w-md rounded-r-2xl'
        : 'right-0 top-0 h-full w-full max-w-lg rounded-l-2xl';

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <Backdrop onClose={onClose} />
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduced ? { opacity: 0 } : { opacity: 0, ...offset }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, ...offset }}
            transition={{ duration: reduced ? 0.12 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn('glass-surface glass-sheet absolute flex flex-col outline-none', position)}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="display text-xl text-fg">
                  {title}
                </h2>
                {description ? <p className="mt-1 text-[0.8125rem] text-fg-muted">{description}</p> : null}
              </div>
              <IconButton label="Close panel" size="sm" onClick={onClose}>
                <X className="size-4" aria-hidden="true" />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
            {footer ? (
              <div className="safe-bottom flex items-center justify-end gap-2 border-t border-line px-5 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

/* ================================================================== confirm */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  children?: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? (
        <p className="text-[0.8125rem] leading-relaxed text-fg-muted">
          This action cannot be undone from here.
        </p>
      )}
    </Modal>
  );
}

/* ==================================================================== menu */

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  hint?: string;
}

export function Menu({
  trigger,
  items,
  align = 'end',
  label,
  header,
}: {
  trigger: (props: { open: boolean; toggle: () => void; ref: RefObject<HTMLButtonElement | null> }) => ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
  label: string;
  header?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const items2 = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    items2?.[activeIndex]?.focus();
  }, [open, activeIndex]);

  const enabled = items.filter((item) => !item.disabled);

  function onListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => {
        const next = event.key === 'ArrowDown' ? current + 1 : current - 1;
        return (next + enabled.length) % Math.max(enabled.length, 1);
      });
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(enabled.length - 1);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {trigger({
        open,
        toggle: () => {
          setOpen((current) => !current);
          setActiveIndex(0);
        },
        ref: triggerRef,
      })}
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={listRef}
            role="menu"
            aria-label={label}
            aria-orientation="vertical"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={onListKeyDown}
            className={cn(
              'glass-surface glass-float absolute z-50 mt-2 min-w-56 overflow-hidden rounded-xl border border-line p-1.5',
              align === 'end' ? 'right-0' : 'left-0',
            )}
          >
            {header ? <div className="border-b border-line px-3 py-2.5">{header}</div> : null}
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => {
                  item.onSelect();
                  close();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[0.8125rem] transition-colors duration-150',
                  item.destructive ? 'text-danger hover:bg-danger-soft' : 'text-fg hover:bg-surface/70',
                  item.disabled && 'pointer-events-none opacity-40',
                )}
              >
                {item.icon ? <span className="text-fg-subtle">{item.icon}</span> : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.label}</span>
                  {item.hint ? <span className="mt-0.5 block text-xs text-fg-subtle">{item.hint}</span> : null}
                </span>
                {item.selected ? <Check className="size-3.5 text-accent" aria-hidden="true" /> : null}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function MenuButton({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/60 px-3 py-2 text-[0.8125rem] text-fg transition-colors hover:border-line-strong',
        className,
      )}
    >
      {children ?? label}
      <ChevronDown className="size-3.5 text-fg-subtle" aria-hidden="true" />
    </span>
  );
}

/* ================================================================= popover */

export function Popover({
  trigger,
  children,
  align = 'end',
  label,
  width = 'w-80',
}: {
  trigger: (props: { open: boolean; toggle: () => void; ref: RefObject<HTMLButtonElement | null> }) => ReactNode;
  children: (props: { close: () => void }) => ReactNode;
  align?: 'start' | 'end';
  label: string;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={containerRef} className="relative">
      {trigger({ open, toggle: () => setOpen((current) => !current), ref: triggerRef })}
      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label={label}
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'glass-surface glass-float absolute z-50 mt-2 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line',
              width,
              align === 'end' ? 'right-0' : 'left-0',
            )}
          >
            {children({ close })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ==================================================================== tabs */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  variant = 'underline',
  className,
}: {
  tabs: { value: T; label: string; count?: number; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  variant?: 'underline' | 'segmented' | 'scroll';
  className?: string;
}) {
  if (variant === 'segmented') {
    return (
      <div role="tablist" aria-label={ariaLabel} className={cn('inline-flex rounded-xl border border-line bg-surface/50 p-1', className)}>
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={cn(
                'relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[0.8125rem] font-medium transition-all duration-200',
                active ? 'bg-raised text-fg shadow-elev-1' : 'text-fg-muted hover:text-fg',
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count != null ? <span className="numeric text-[0.6875rem] text-fg-subtle">{tab.count}</span> : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex gap-1 border-b border-line',
        variant === 'scroll' && 'no-scrollbar overflow-x-auto',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative shrink-0 px-3.5 py-2.5 text-[0.8125rem] font-medium transition-colors duration-200',
              active ? 'text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            <span className="inline-flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.count != null ? (
                <span className="numeric rounded-full border border-line px-1.5 text-[0.625rem] text-fg-subtle">
                  {tab.count}
                </span>
              ) : null}
            </span>
            {active ? (
              <motion.span
                layoutId={`tab-underline-${ariaLabel}`}
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent"
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
