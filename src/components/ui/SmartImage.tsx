import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { gradientFor } from '@/data/media';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Applied to the wrapper; the image itself always fills it. */
  wrapperClassName?: string;
  ratio?: string;
  priority?: boolean;
  sizes?: string;
  fallbackLabel?: string;
}

/**
 * Photography enters the interface through this component only, so loading
 * behaviour, aspect handling and failure states stay consistent everywhere.
 */
export function SmartImage({
  src,
  alt,
  className,
  wrapperClassName,
  ratio,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 640px',
  fallbackLabel,
}: SmartImageProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(src ? 'loading' : 'failed');

  useEffect(() => {
    setStatus(src ? 'loading' : 'failed');
  }, [src]);

  return (
    <div
      className={cn('relative overflow-hidden', wrapperClassName)}
      style={{
        aspectRatio: ratio,
        background: gradientFor(src || alt),
      }}
    >
      {status === 'loading' && <div className="absolute inset-0 skeleton" aria-hidden="true" />}
      {status === 'failed' ? (
        <div
          className="absolute inset-0 flex items-end p-4"
          style={{ background: gradientFor(src || alt) }}
          aria-hidden="true"
        >
          {fallbackLabel ? (
            <span className="text-[0.625rem] uppercase tracking-[0.18em] text-white/55">{fallbackLabel}</span>
          ) : null}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('failed')}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500 ease-out',
            status === 'ready' ? 'opacity-100' : 'opacity-0',
            className,
          )}
        />
      )}
    </div>
  );
}
