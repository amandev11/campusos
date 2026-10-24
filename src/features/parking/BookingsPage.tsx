import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CircleParking, Plus, ShieldCheck } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { PARKING_LOTS, PARKING_RULES_SUMMARY, parkingLotById } from '@/data/parking';
import { formatDate, formatTime, relativeTime, todayIso } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Badge,
  Button,
  DataOriginTag,
  EmptyState,
  InlineNote,
  Panel,
  SectionHeader,
  StatTile,
  type Tone,
} from '@/components/ui/primitives';
import { Field, Select, TextArea } from '@/components/ui/fields';
import { Modal, Tabs } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/Toast';
import { ModuleHero } from '@/features/shared';
import type { Reservation, ReservationStatus } from '@/lib/types';

const STATUS_TONE: Record<ReservationStatus, Tone> = {
  confirmed: 'ok',
  cancelled: 'danger',
  completed: 'muted',
  expired: 'warn',
};

export default function BookingsPage() {
  const toast = useToast();
  const { state, cancelReservation, profile } = useApp();
  const [view, setView] = useState<'upcoming' | 'past' | 'cancelled' | 'all'>('upcoming');
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const [reason, setReason] = useState('Plans changed');

  const now = new Date();
  const today = todayIso();

  const sorted = useMemo(
    () =>
      [...state.reservations].sort((a, b) =>
        `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`),
      ),
    [state.reservations],
  );

  const filtered = useMemo(() => {
    switch (view) {
      case 'upcoming':
        return sorted
          .filter((reservation) => reservation.status === 'confirmed' && reservation.date >= today)
          .reverse();
      case 'past':
        return sorted.filter(
          (reservation) => reservation.date < today || reservation.status === 'completed',
        );
      case 'cancelled':
        return sorted.filter((reservation) => reservation.status === 'cancelled');
      default:
        return sorted;
    }
  }, [sorted, view, today]);

  const upcoming = sorted.filter((reservation) => reservation.status === 'confirmed' && reservation.date >= today);
  const next = upcoming[upcoming.length - 1];
  const hoursParked = state.reservations
    .filter((reservation) => reservation.status === 'completed')
    .reduce((sum, reservation) => sum + (Number(reservation.end.slice(0, 2)) - Number(reservation.start.slice(0, 2))), 0);

  function canCancel(reservation: Reservation): { allowed: boolean; reason?: string } {
    if (reservation.status !== 'confirmed') return { allowed: false, reason: 'Only confirmed reservations can be cancelled.' };
    const slotStart = new Date(`${reservation.date}T${reservation.start}:00`);
    const hoursAway = (slotStart.getTime() - now.getTime()) / 3600000;
    if (hoursAway < 1) {
      return { allowed: false, reason: 'Cancellations close one hour before the slot starts. Contact the security desk.' };
    }
    return { allowed: true };
  }

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Campus parking"
        title="Your reservations"
        description="Every booking with its reference, bay type and vehicle. Cancel at least an hour before the slot to release the bay without a penalty."
        tone="teal"
        meta={
          <>
            <Badge tone="accent">{upcoming.length} upcoming</Badge>
            <Badge tone="muted">{state.reservations.length} in total</Badge>
            <Badge tone="neutral">Permit: {profile.parkingEligibility}</Badge>
            <DataOriginTag origin="demo" />
          </>
        }
        actions={
          <Link
            to="/parking"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
          >
            <Plus className="size-4" aria-hidden="true" />
            New reservation
          </Link>
        }
        aside={
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Upcoming" value={upcoming.length} hint="Confirmed and future" />
            <StatTile label="Cancelled" value={state.reservations.filter((r) => r.status === 'cancelled').length} hint="Released" />
            <StatTile label="Completed" value={state.reservations.filter((r) => r.status === 'completed').length} hint="Used" />
            <StatTile label="Hours booked" value={hoursParked} hint="Across completed bookings" icon={<CalendarClock className="size-4" />} />
          </div>
        }
      />

      {next ? (
        <Panel strength="float" className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="caps">Next booking</p>
            <p className="mt-2 text-[1.125rem] text-fg">{next.lotName}</p>
            <p className="mt-1 text-xs text-fg-muted">
              {formatDate(next.date, 'long')} · {formatTime(next.start)} – {formatTime(next.end)}
            </p>
            <p className="mt-1 text-[0.6875rem] text-fg-subtle">
              {next.zoneLabel} · {next.plate} · reference {next.reference}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/parking/${next.lotId}`}
              className="inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
            >
              Area details
            </Link>
            <Button variant="quiet" onClick={() => setCancelling(next)}>
              Cancel booking
            </Button>
          </div>
        </Panel>
      ) : null}

      <Tabs
        ariaLabel="Reservation filters"
        variant="segmented"
        value={view}
        onChange={setView}
        tabs={[
          { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { value: 'past', label: 'Past', count: sorted.filter((r) => r.date < today || r.status === 'completed').length },
          { value: 'cancelled', label: 'Cancelled', count: sorted.filter((r) => r.status === 'cancelled').length },
          { value: 'all', label: 'All', count: sorted.length },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CircleParking className="size-5" aria-hidden="true" />}
          title={view === 'upcoming' ? 'No upcoming reservations' : 'Nothing in this view'}
          description={
            view === 'upcoming'
              ? 'Reservations you make at any campus area appear here with their reference, ready to show at the barrier.'
              : 'Try another tab to see past or cancelled bookings.'
          }
          action={
            <Link
              to="/parking"
              className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
            >
              Find a space
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((reservation) => {
            const lot = parkingLotById(reservation.lotId);
            const cancellation = canCancel(reservation);
            return (
              <Panel key={reservation.id} className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div
                  className={cn(
                    'flex w-full shrink-0 flex-col items-center justify-center rounded-xl border py-3 sm:w-20',
                    reservation.status === 'confirmed' ? 'border-ok/35 bg-ok-soft' : 'border-line bg-surface/45',
                  )}
                >
                  <span className="numeric text-[1.375rem] leading-none text-fg">
                    {new Date(reservation.date).getDate()}
                  </span>
                  <span className="mt-1 text-[0.625rem] uppercase tracking-wider text-fg-subtle">
                    {new Date(reservation.date).toLocaleString('en-GB', { month: 'short' })}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={STATUS_TONE[reservation.status]}>{reservation.status}</Badge>
                    <Badge tone="neutral">{reservation.lotCode}</Badge>
                    <Badge tone="muted">{reservation.zoneLabel}</Badge>
                    <DataOriginTag origin={reservation.origin} />
                  </div>
                  <h3 className="mt-2 text-[0.9375rem] font-medium text-fg">{reservation.lotName}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                    <span className="numeric">
                      {formatTime(reservation.start)} – {formatTime(reservation.end)}
                    </span>
                    <span>{formatDate(reservation.date, 'medium')}</span>
                    <span>{reservation.plate}</span>
                  </p>
                  <p className="mt-1.5 text-[0.6875rem] text-fg-subtle">
                    Reference {reservation.reference} · created {relativeTime(reservation.createdAt)}
                    {reservation.cancelReason ? ` · cancelled: ${reservation.cancelReason}` : ''}
                  </p>
                  {reservation.status === 'confirmed' && !cancellation.allowed && cancellation.reason ? (
                    <p className="mt-2 text-[0.6875rem] text-warn">{cancellation.reason}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {lot ? (
                      <Link
                        to={`/parking/${lot.id}`}
                        className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-xs text-fg transition-colors hover:border-line-strong"
                      >
                        Area details
                      </Link>
                    ) : null}
                    {reservation.status === 'confirmed' ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setCancelling(reservation)}
                        disabled={!cancellation.allowed}
                      >
                        Cancel reservation
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionHeader eyebrow="Policy" title="Cancellation and overstay rules" />
          <ul className="mt-4 space-y-2.5">
            {PARKING_RULES_SUMMARY.map((rule) => (
              <li key={rule} className="flex gap-3 text-xs leading-relaxed text-fg-muted">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-teal" aria-hidden="true" />
                {rule}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel strength="quiet">
          <SectionHeader
            eyebrow="Not connected"
            title="What CampusOS cannot do for parking"
            description="Stated plainly so nobody expects a gate to open."
          />
          <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-fg-muted">
            <li>No barrier release — campus security controls entry and exit.</li>
            <li>No vehicle registration — permits are issued by the estate office.</li>
            <li>No sensor reading — availability figures here are simulated demonstration data.</li>
            <li>No payment — any fee is collected at the gate, per the notice displayed there.</li>
          </ul>
          <InlineNote tone="neutral" className="mt-4">
            {PARKING_LOTS.length} areas are described in this build, with{' '}
            {PARKING_LOTS.filter((lot) => lot.requiresReservation).length} requiring a reservation.
          </InlineNote>
        </Panel>
      </div>

      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel this reservation?"
        description={
          cancelling
            ? `${cancelling.lotName} · ${formatDate(cancelling.date, 'medium')} · ${formatTime(cancelling.start)} – ${formatTime(cancelling.end)}`
            : ''
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelling(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!cancelling) return;
                const result = cancelReservation(cancelling.id, reason);
                if (!result.ok) {
                  toast.error('Could not cancel', result.error);
                  return;
                }
                toast.success('Reservation cancelled', 'The bay has been released.');
                setCancelling(null);
              }}
            >
              Cancel reservation
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Reason" hint="Helps the estate office spot recurring problems.">
            <Select value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="Plans changed">Plans changed</option>
              <option value="Studio session moved online">Class cancelled</option>
              <option value="Travelling by campus shuttle">Travelling another way</option>
              <option value="Found another area">Found another area</option>
              <option value="Vehicle unavailable">Vehicle unavailable</option>
            </Select>
          </Field>
          <TextArea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            aria-label="Additional detail"
          />
          <InlineNote tone="neutral">
            Cancelling releases the bay immediately. The reservation stays in your history as cancelled.
          </InlineNote>
        </div>
      </Modal>
    </div>
  );
}
