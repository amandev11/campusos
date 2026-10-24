import { Link } from 'react-router-dom';
import {
  Accessibility,
  CalendarClock,
  Car,
  Clock,
  Info,
  MapPin,
  Receipt,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ELIGIBILITY_LABELS } from '@/data/parking';
import { formatDate, formatTime, percent, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Badge, Button, DataOriginTag, Meter, StatTile, type Tone } from '@/components/ui/primitives';
import { SmartImage } from '@/components/ui/SmartImage';
import type { ParkingEligibility, ParkingLot, Reservation } from '@/lib/types';

export function availabilityTone(lot: ParkingLot): Tone {
  if (!lot.occupancy) return 'muted';
  const free = percent(lot.occupancy.available, lot.capacity);
  if (free <= 5) return 'danger';
  if (free <= 20) return 'warn';
  return 'ok';
}

export function AvailabilityFigure({ lot, className }: { lot: ParkingLot; className?: string }) {
  if (!lot.occupancy) {
    return (
      <div className={cn('rounded-xl border border-line bg-surface/45 px-3.5 py-3', className)}>
        <p className="caps">Availability</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-fg-muted">
          <Info className="size-3.5 text-fg-subtle" aria-hidden="true" />
          No live feed connected
        </p>
        <p className="mt-1 text-[0.6875rem] text-fg-subtle">
          Check the entry display or ask an attendant. Capacity: {lot.capacity} spaces.
        </p>
      </div>
    );
  }

  const free = lot.occupancy.available;
  const tone = availabilityTone(lot);
  return (
    <div className={cn('rounded-xl border border-line bg-surface/45 px-3.5 py-3', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="caps">Free now</p>
        <Badge tone={tone}>{tone === 'ok' ? 'Plenty' : tone === 'warn' ? 'Filling up' : 'Nearly full'}</Badge>
      </div>
      <p className="numeric mt-1.5 text-[1.5rem] leading-none text-fg">
        {free}
        <span className="ml-1 text-sm text-fg-subtle">/ {lot.capacity}</span>
      </p>
      <div className="mt-2.5">
        <Meter value={free} max={lot.capacity} tone={tone === 'muted' ? 'accent' : tone} />
      </div>
      <p className="mt-2 text-[0.625rem] leading-relaxed text-fg-subtle">
        {lot.occupancy.source} · updated {relativeTime(lot.occupancy.updatedAt)}
      </p>
    </div>
  );
}

export function LotCard({ lot, isSaved }: { lot: ParkingLot; isSaved?: boolean }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/40 transition-all duration-300 hover:border-line-strong hover:shadow-elev-3">
      <Link to={`/parking/${lot.id}`} className="relative block" aria-label={`View ${lot.name}`}>
        <SmartImage src={lot.image} alt="" ratio="16 / 9" sizes="(max-width: 640px) 90vw, 380px" />
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <Badge tone="neutral">{lot.code}</Badge>
          <Badge tone={availabilityTone(lot)}>
            {lot.occupancy ? `${lot.occupancy.available} free` : 'No live feed'}
          </Badge>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/parking/${lot.id}`}>
              <h3 className="text-[0.9375rem] font-medium text-fg transition-colors group-hover:text-accent">
                {lot.name}
              </h3>
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-subtle">
              <Clock className="size-3" aria-hidden="true" />
              <span className="truncate">{lot.hours}</span>
            </p>
          </div>
          {isSaved ? <Badge tone="accent">Saved</Badge> : null}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-surface/50 px-2.5 py-2">
            <p className="text-[0.625rem] uppercase tracking-wider text-fg-subtle">Spaces</p>
            <p className="numeric mt-1 text-[0.8125rem] text-fg">{lot.capacity}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface/50 px-2.5 py-2">
            <p className="flex items-center gap-1 text-[0.625rem] uppercase tracking-wider text-fg-subtle">
              <Accessibility className="size-3" aria-hidden="true" />
              Accessible
            </p>
            <p className="numeric mt-1 text-[0.8125rem] text-fg">{lot.accessibleSpaces}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface/50 px-2.5 py-2">
            <p className="flex items-center gap-1 text-[0.625rem] uppercase tracking-wider text-fg-subtle">
              <Zap className="size-3" aria-hidden="true" />
              EV
            </p>
            <p className="numeric mt-1 text-[0.8125rem] text-fg">{lot.evSpaces}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {lot.eligibility.slice(0, 3).map((entry) => (
            <Badge key={entry} tone="muted">
              {ELIGIBILITY_LABELS[entry]}
            </Badge>
          ))}
          {lot.requiresReservation ? <Badge tone="accent">Reservation required</Badge> : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="flex min-w-0 items-center gap-1.5 text-[0.6875rem] text-fg-subtle">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {Object.entries(lot.walkMinutes)[0]
                ? `${Object.entries(lot.walkMinutes)[0]![1]} min to ${Object.entries(lot.walkMinutes)[0]![0]}`
                : 'On campus'}
            </span>
          </span>
          <Link
            to={`/parking/${lot.id}`}
            className="shrink-0 text-[0.6875rem] font-medium text-accent transition-colors hover:text-accent-hover"
          >
            View & reserve
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Spatial campus overview. Positions are declared in the data set rather than
 * geo-referenced, because no campus map service is connected.
 */
export function CampusMap({
  lots,
  activeLotId,
  onSelect,
  className,
}: {
  lots: ParkingLot[];
  activeLotId?: string | null;
  onSelect?: (lotId: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line bg-surface/40',
        className,
      )}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="parking-grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M6 0H0V6" fill="none" stroke="var(--line)" strokeWidth="0.25" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#parking-grid)" />
        <path d="M8 88h84" stroke="var(--line-strong)" strokeWidth="0.6" strokeDasharray="2 2" />
        <path d="M8 12v76" stroke="var(--line-strong)" strokeWidth="0.6" strokeDasharray="2 2" />
        <rect x="30" y="30" width="24" height="18" rx="2" fill="var(--line)" opacity="0.5" />
        <text x="42" y="41" textAnchor="middle" fontSize="3" fill="var(--fg-subtle)" fontFamily="var(--font-sans)">
          Academic block
        </text>
        <rect x="62" y="48" width="22" height="16" rx="2" fill="var(--line)" opacity="0.5" />
        <text x="73" y="58" textAnchor="middle" fontSize="3" fill="var(--fg-subtle)" fontFamily="var(--font-sans)">
          West campus
        </text>
      </svg>

      {lots.map((lot) => {
        const active = lot.id === activeLotId;
        const tone = availabilityTone(lot);
        const colour =
          tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : tone === 'danger' ? 'var(--danger)' : 'var(--fg-subtle)';
        return (
          <button
            key={lot.id}
            type="button"
            onClick={() => onSelect?.(lot.id)}
            aria-label={`${lot.name}, ${lot.occupancy ? `${lot.occupancy.available} free` : 'no live availability'}`}
            aria-pressed={active}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${lot.gridX}%`, top: `${lot.gridY}%` }}
          >
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2 py-1 text-[0.625rem] font-medium backdrop-blur-sm transition-all duration-200',
                active
                  ? 'border-accent/60 bg-accent-soft text-accent'
                  : 'border-line bg-canvas/80 text-fg-muted group-hover:border-line-strong group-hover:text-fg',
              )}
            >
              <span className="size-1.5 rounded-full" style={{ background: colour }} aria-hidden="true" />
              <Car className="size-3" aria-hidden="true" />
              <span className="numeric">{lot.code}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ReservationCard({
  reservation,
  onCancel,
}: {
  reservation: Reservation;
  onCancel?: (reservation: Reservation) => void;
}) {
  const tone: Tone =
    reservation.status === 'confirmed' ? 'ok' : reservation.status === 'cancelled' ? 'danger' : 'muted';
  return (
    <article className="rounded-2xl border border-line bg-surface/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={tone}>{reservation.status}</Badge>
            <Badge tone="neutral">{reservation.lotCode}</Badge>
            <DataOriginTag origin={reservation.origin} />
          </div>
          <h3 className="mt-2 text-[0.9375rem] font-medium text-fg">{reservation.lotName}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3 text-fg-subtle" aria-hidden="true" />
              {formatDate(reservation.date, 'medium')}
            </span>
            <span className="numeric">
              {formatTime(reservation.start)} – {formatTime(reservation.end)}
            </span>
          </p>
          <p className="mt-1 text-[0.6875rem] text-fg-subtle">
            {reservation.zoneLabel} · {reservation.plate} · ref {reservation.reference}
          </p>
          {reservation.cancelReason ? (
            <p className="mt-1.5 text-[0.6875rem] text-danger">Cancelled: {reservation.cancelReason}</p>
          ) : null}
        </div>
        {reservation.status === 'confirmed' && onCancel ? (
          <Button variant="quiet" size="sm" onClick={() => onCancel(reservation)}>
            Cancel
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function EligibilityNotice({
  lot,
  eligibility,
  className,
}: {
  lot: ParkingLot;
  eligibility: ParkingEligibility;
  className?: string;
}) {
  const allowed = lot.eligibility.includes(eligibility);
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-3.5 py-3 text-[0.8125rem]',
        allowed ? 'border-ok/35 bg-ok-soft' : 'border-danger/35 bg-danger-soft',
        className,
      )}
    >
      <ShieldCheck className={cn('mt-0.5 size-4 shrink-0', allowed ? 'text-ok' : 'text-danger')} aria-hidden="true" />
      <p className={allowed ? 'text-ok' : 'text-danger'}>
        {allowed
          ? `Your ${eligibility} permit is valid in this area.`
          : `This area is restricted to ${lot.eligibility.map((entry) => ELIGIBILITY_LABELS[entry].toLowerCase()).join(', ')}. Your ${eligibility} permit is not accepted.`}
      </p>
    </div>
  );
}

export function ParkingStats({ lots }: { lots: ParkingLot[] }) {
  const withFeed = lots.filter((lot) => lot.occupancy);
  const totalCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
  const free = withFeed.reduce((sum, lot) => sum + (lot.occupancy?.available ?? 0), 0);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile label="Areas" value={lots.length} hint="Across both campuses" icon={<MapPin className="size-4" />} />
      <StatTile label="Total spaces" value={totalCapacity} hint="Declared capacity" icon={<Car className="size-4" />} />
      <StatTile
        label="Free (simulated)"
        value={free}
        hint={`${withFeed.length} of ${lots.length} areas report a feed`}
        tone="accent"
        icon={<Receipt className="size-4" />}
      />
      <StatTile
        label="Reservation areas"
        value={lots.filter((lot) => lot.requiresReservation).length}
        hint="Booking required before entry"
        icon={<ShieldCheck className="size-4" />}
      />
    </div>
  );
}
