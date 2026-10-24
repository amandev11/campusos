import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, BookOpen, CircleParking, Compass, GraduationCap, Settings2, Trash } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/format';
import { Badge, EmptyState, IconButton, StatusDot, type Tone } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/overlays';
import type { AppNotification } from '@/lib/types';

const MODULE_ICON = {
  books: BookOpen,
  opportunities: Compass,
  academics: GraduationCap,
  parking: CircleParking,
  system: Settings2,
} as const;

const MODULE_TONE: Record<AppNotification['module'], Tone> = {
  books: 'accent',
  opportunities: 'teal',
  academics: 'warn',
  parking: 'ok',
  system: 'muted',
};

export function NotificationList({
  variant = 'panel',
  onNavigate,
}: {
  variant?: 'panel' | 'page';
  onNavigate?: () => void;
}) {
  const { state, markNotificationRead, markAllNotificationsRead, removeNotification } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread' | 'deadlines'>('all');

  const filtered = useMemo(() => {
    if (filter === 'unread') return state.notifications.filter((entry) => !entry.read);
    if (filter === 'deadlines') {
      return state.notifications.filter((entry) => entry.module === 'academics' || entry.module === 'parking');
    }
    return state.notifications;
  }, [state.notifications, filter]);

  const unread = state.notifications.filter((entry) => !entry.read).length;

  return (
    <div className={cn('flex min-h-0 flex-col', variant === 'panel' && 'max-h-[26rem]')}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="text-[0.8125rem] font-medium text-fg">Notifications</p>
          <p className="text-xs text-fg-subtle">
            {unread === 0 ? 'You are up to date' : `${unread} unread`}
          </p>
        </div>
        {unread > 0 ? (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="text-xs text-accent transition-colors hover:text-accent-hover"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      {variant === 'page' ? (
        <div className="px-4 pt-3">
          <Tabs
            ariaLabel="Notification filters"
            variant="segmented"
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: 'all', label: 'All', count: state.notifications.length },
              { value: 'unread', label: 'Unread', count: unread },
              { value: 'deadlines', label: 'Academic' },
            ]}
          />
        </div>
      ) : null}

      <div className={cn('min-h-0 flex-1 overflow-y-auto', variant === 'panel' ? 'px-2 py-2' : 'px-4 py-3')}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Bell className="size-5" aria-hidden="true" />}
            title={filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
            description={
              filter === 'unread'
                ? 'Every notification has been read. New deadlines and replies will appear here.'
                : 'Deadline reminders, replies and updates from your modules arrive here.'
            }
            className="border-none py-8"
          />
        ) : (
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {filtered.map((entry) => {
                const Icon = MODULE_ICON[entry.module];
                const content = (
                  <>
                    <span
                      className={cn(
                        'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border',
                        entry.read ? 'border-line bg-surface/50 text-fg-subtle' : 'border-accent/35 bg-accent-soft text-accent',
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className={cn('min-w-0 flex-1 text-[0.8125rem] leading-snug', entry.read ? 'text-fg-muted' : 'font-medium text-fg')}>
                          {entry.title}
                        </span>
                        {!entry.read ? <StatusDot tone="accent" /> : null}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-fg-muted">{entry.body}</span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <Badge tone={MODULE_TONE[entry.module]}>{entry.module}</Badge>
                        <span className="text-[0.6875rem] text-fg-subtle">{relativeTime(entry.createdAt)}</span>
                      </span>
                    </span>
                  </>
                );

                return (
                  <motion.li
                    key={entry.id}
                    layout="position"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group relative rounded-xl border border-transparent transition-colors hover:border-line hover:bg-surface/45"
                  >
                    {entry.href ? (
                      <Link
                        to={entry.href}
                        onClick={() => {
                          markNotificationRead(entry.id);
                          onNavigate?.();
                        }}
                        className="flex gap-3 rounded-xl p-3"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(entry.id)}
                        className="flex w-full gap-3 rounded-xl p-3 text-left"
                      >
                        {content}
                      </button>
                    )}
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <IconButton
                        label={`Remove notification: ${entry.title}`}
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeNotification(entry.id);
                        }}
                      >
                        <Trash className="size-3.5" aria-hidden="true" />
                      </IconButton>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
