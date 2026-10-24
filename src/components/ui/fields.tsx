import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/* ==================================================================== field */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-1.5 text-[0.8125rem] font-medium text-fg">
        {label}
        {required ? (
          <span className="text-accent" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL_BASE =
  'w-full rounded-xl border bg-[var(--glass-input-bg)] px-3.5 text-[0.875rem] text-fg placeholder:text-fg-subtle transition-colors duration-200 disabled:opacity-50';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function TextInput({ className, invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          CONTROL_BASE,
          'h-11',
          invalid ? 'border-danger/60' : 'border-line hover:border-line-strong focus:border-accent/60',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function TextArea({ className, invalid, rows = 4, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        'resize-y py-2.5 leading-relaxed',
        invalid ? 'border-danger/60' : 'border-line hover:border-line-strong focus:border-accent/60',
        className,
      )}
      {...rest}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          CONTROL_BASE,
          'h-11 appearance-none border-line pr-9 hover:border-line-strong focus:border-accent/60',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle" aria-hidden="true">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
});

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        role="checkbox"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200',
          checked ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong bg-surface/60 text-transparent hover:border-fg-subtle',
          disabled && 'opacity-50',
        )}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
      </button>
      <label htmlFor={id} className="min-w-0 cursor-pointer text-[0.8125rem] leading-relaxed text-fg">
        {label}
        {hint ? <span className="mt-0.5 block text-xs text-fg-subtle">{hint}</span> : null}
      </label>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[0.8125rem] font-medium text-fg">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-fg-subtle">{hint}</span> : null}
      </label>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300',
          checked ? 'border-accent/50 bg-accent/80' : 'border-line bg-surface/70',
          disabled && 'opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 rounded-full bg-fg transition-transform duration-300 ease-out',
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
          )}
          style={{ width: 18, height: 18 }}
        />
      </button>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  onSubmit,
  autoFocus,
  className,
  inputRef,
  size = 'md',
  trailing,
  label = 'Search',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  size?: 'sm' | 'md' | 'lg';
  trailing?: ReactNode;
  label?: string;
}) {
  const height = size === 'lg' ? 'h-13' : size === 'sm' ? 'h-9' : 'h-11';
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="pointer-events-none absolute left-3.5 size-4 text-fg-subtle" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label={label}
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && onSubmit) {
            event.preventDefault();
            onSubmit();
          }
        }}
        className={cn(
          CONTROL_BASE,
          height,
          'border-line pl-10',
          trailing ? 'pr-24' : 'pr-9',
          'hover:border-line-strong focus:border-accent/60',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {value.length > 0 && !trailing ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 text-fg-subtle transition-colors hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
      {trailing ? <div className="absolute right-2 flex items-center gap-1">{trailing}</div> : null}
    </div>
  );
}

export function OptionCards<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
  name,
}: {
  options: { value: T; label: string; hint?: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3;
  name: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        'grid gap-2',
        columns === 1 ? 'grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-xl border px-3.5 py-3 text-left transition-all duration-200',
              active
                ? 'border-accent/55 bg-accent-soft'
                : 'border-line bg-surface/45 hover:border-line-strong hover:bg-surface/70',
              option.disabled && 'cursor-not-allowed opacity-45',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-[0.8125rem] font-medium text-fg">{option.label}</span>
              <span
                className={cn(
                  'flex size-4 items-center justify-center rounded-full border transition-colors',
                  active ? 'border-accent bg-accent' : 'border-line-strong',
                )}
                aria-hidden="true"
              >
                {active ? <span className="size-1.5 rounded-full bg-accent-ink" /> : null}
              </span>
            </span>
            {option.hint ? <span className="mt-1 block text-xs leading-snug text-fg-subtle">{option.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function FilterPill({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
        active
          ? 'border-accent/50 bg-accent-soft text-accent'
          : 'border-line bg-surface/50 text-fg-muted hover:border-line-strong hover:text-fg',
      )}
    >
      {children}
      {count != null ? <span className="numeric text-[0.625rem] opacity-70">{count}</span> : null}
    </button>
  );
}
