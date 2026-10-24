import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Settings2 } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { Button, Panel, SectionHeader, StatTile } from '@/components/ui/primitives';
import { NotificationList } from '@/features/notifications/NotificationList';
import { ModuleHero } from '@/features/shared';

export default function NotificationsPage() {
  const { state, unreadNotifications, markAllNotificationsRead } = useApp();

  const byModule = (module: string) => state.notifications.filter((entry) => entry.module === module).length;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Notifications"
        title="Everything that needs your attention"
        description="Deadline reminders, replies and updates collected from every module into one feed, so nothing important depends on you checking four different places."
        meta={
          <>
            <span className="inline-flex items-center gap-2">
              <Bell className="size-4 text-accent" aria-hidden="true" />
              <span className="text-[0.8125rem] text-fg">
                {unreadNotifications === 0 ? 'You are up to date' : `${unreadNotifications} unread`}
              </span>
            </span>
          </>
        }
        actions={
          <Button
            variant="secondary"
            icon={<CheckCheck className="size-4" />}
            onClick={markAllNotificationsRead}
            disabled={unreadNotifications === 0}
          >
            Mark all read
          </Button>
        }
        aside={
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Academic" value={byModule('academics')} hint="Deadlines and notices" />
            <StatTile label="Travel & work" value={byModule('opportunities')} hint="Application deadlines" />
            <StatTile label="Books" value={byModule('books')} hint="Listing activity" />
            <StatTile label="Parking" value={byModule('parking')} hint="Reservations" />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel padded={false}>
          <NotificationList variant="page" />
        </Panel>

        <div className="space-y-5">
          <Panel>
            <SectionHeader
              eyebrow="How this works"
              title="Described honestly"
              description="What generates these, and what does not."
            />
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-fg-muted">
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                Notifications are produced by rules over your own records: approaching assignment deadlines,
                application closing dates and reservation start times.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                No email, SMS or push notification is sent. Nothing leaves this browser.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                There is no AI summarisation here — no model is configured, so nothing is presented as intelligent
                when it is simply a rule.
              </li>
            </ul>
          </Panel>

          <Panel strength="quiet">
            <p className="caps">Tune the feed</p>
            <p className="mt-2 text-xs leading-relaxed text-fg-muted">
              Choose which modules contribute to your dashboard, and connect an institution feed so academic
              notifications become authoritative rather than sample data.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/settings?tab=preferences"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-xs text-fg transition-colors hover:border-line-strong"
              >
                <Settings2 className="size-3.5" aria-hidden="true" />
                Dashboard preferences
              </Link>
              <Link
                to="/settings?tab=integrations"
                className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-xs text-fg transition-colors hover:border-line-strong"
              >
                Integration status
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
