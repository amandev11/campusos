import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Accessibility,
  Car,
  Check,
  Clock,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { ELIGIBILITY_LABELS, PARKING_LOTS } from '@/data/parking';
import { addDays, formatDate, formatTime, percent, relativeTime, toIsoDate, todayIso } from '@/lib/format';
import { findConflictingReservation } from '@/store/state';
import { cn } from '@/lib/cn';
import {
  Badge,
  Button,
  DataOriginTag,
  Divider,
  EmptyState,
  InlineNote,
  KeyValue,
  Panel,
  ProgressSteps,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { Field, FilterPill, Select, TextInput } from '@/components/ui/fields';
import { SmartImage } from '@/components/ui/SmartImage';
import { useToast } from '@/components/ui/Toast';
import { AvailabilityFigure, CampusMap, EligibilityNotice, availabilityTone } from './components';
import type { Reservation } from '@/lib/types';

const STEPS = ['Choose a slot', 'Select a bay', 'Confirm'];

const TIME_SLOTS = Array.from({ length: 25 }, (_, index) => {
  const hour = 7 + Math.floor(index / 2);
  const minute = index % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
}).filter((time) => time >= '07:00' && time <= '22:00');

export default function ParkingLotPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, profile, reserve, isSaved, toggleSaved } = useApp();

  const lot = PARKING_LOTS.find((entry) => entry.id === lotId);
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(todayIso());
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('13:00');
  const [zoneLabel, setZoneLabel] = useState(lot?.zones[0]?.label ?? '');
  const [plate, setPlate] = useState(profile.vehicleLabel || '');
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eligible = lot ? lot.eligibility.includes(profile.parkingEligibility) : false;
  const saved = lot ? isSaved(lot.id) : false;

  const conflict = useMemo(() => {
    if (!lot) return undefined;
    return findConflictingReservation(state.reservations, { lotId: lot.id, date, start, end });
  }, [state.reservations, lot, date, start, end]);

  const activeReservations = useMemo(
    () =>
      state.reservations
        .filter((reservation) => reservation.lotId === lotId && reservation.status === 'confirmed')
        .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)),
    [state.reservations, lotId],
  );

  const maxDate = toIsoDate(addDays(new Date(), 14));
  const hours = (() => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh! * 60 + em! - (sh! * 60 + sm!)) / 60;
  })();

  if (!lot) {
    return (
      <EmptyState
        icon={<MapPin className="size-5" aria-hidden="true" />}
        title="That parking area no longer exists"
        description="It may have been closed for works. Other areas on campus are still listed."
        action={
          <Link
            to="/parking"
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
          >
            Back to parking
          </Link>
        }
      />
    );
  }

  function submit() {
    const result = reserve({ lotId: lot!.id, zoneLabel, date, start, end, plate, purpose: '' });
    if (!result.ok || !result.value) {
      setError(result.error ?? 'Could not complete the reservation.');
      return;
    }
    setError(null);
    setConfirmed(result.value);
    toast.success('Reservation confirmed', `Reference ${result.value.reference}`);
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-fg-subtle transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back
      </button>

      <Panel padded={false} className="overflow-hidden">
        <div className="relative">
          <SmartImage src={lot.image} alt="" ratio="21 / 9" sizes="(max-width: 1024px) 100vw, 1100px" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/50 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="neutral">{lot.code}</Badge>
              <Badge tone={availabilityTone(lot)}>{lot.zone} zone</Badge>
              {lot.requiresReservation ? <Badge tone="accent">Reservation required</Badge> : null}
              <DataOriginTag origin="demo" />
            </div>
            <h1 className="display mt-3 text-[1.875rem] leading-tight text-fg sm:text-[2.5rem]">{lot.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-fg-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" />
                {lot.hours}
              </span>
              <span className="flex items-center gap-1.5">
                <Car className="size-4" aria-hidden="true" />
                {lot.capacity} spaces
              </span>
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Capacity" value={lot.capacity} hint="Declared spaces" icon={<Car className="size-4" />} />
            <StatTile
              label="Accessible"
              value={lot.accessibleSpaces}
              hint="Requires an accessibility permit"
              icon={<Accessibility className="size-4" />}
            />
            <StatTile label="EV charging" value={lot.evSpaces} hint="Charge, do not park" icon={<Zap className="size-4" />} />
            <StatTile
              label="Free now"
              value={lot.occupancy ? lot.occupancy.available : '—'}
              hint={lot.occupancy ? 'Simulated feed' : 'No feed connected'}
              tone="accent"
            />
          </div>

          <EligibilityNotice lot={lot} eligibility={profile.parkingEligibility} />

          <Panel>
            <SectionHeader
              eyebrow="Availability"
              title="What the feed reports"
              description="Each figure carries its source and timestamp. Where no feed exists, we say so rather than guessing."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <AvailabilityFigure lot={lot} />
              <div className="rounded-xl border border-line bg-surface/45 p-3.5">
                <p className="caps">Walk times</p>
                <ul className="mt-2.5 space-y-1.5">
                  {Object.entries(lot.walkMinutes).map(([destination, minutes]) => (
                    <li key={destination} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-fg-muted">{destination}</span>
                      <span className="numeric shrink-0 text-fg">{minutes} min</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionHeader
              eyebrow="Layout"
              title="Bay types and zones"
              description="Pick the zone that matches how long you are staying."
            />
            <ul className="mt-5 space-y-2.5">
              {lot.zones.map((zone) => (
                <li key={zone.label} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/45 p-3.5">
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg border',
                        zone.kind === 'accessible'
                          ? 'border-teal/40 bg-teal-soft text-teal'
                          : zone.kind === 'ev'
                            ? 'border-accent/40 bg-accent-soft text-accent'
                            : 'border-line bg-surface/60 text-fg-subtle',
                      )}
                    >
                      {zone.kind === 'accessible' ? (
                        <Accessibility className="size-4" aria-hidden="true" />
                      ) : zone.kind === 'ev' ? (
                        <Zap className="size-4" aria-hidden="true" />
                      ) : (
                        <Car className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.8125rem] text-fg">{zone.label}</span>
                      <span className="text-[0.6875rem] capitalize text-fg-subtle">{zone.kind} bays</span>
                    </span>
                  </span>
                  <span className="numeric shrink-0 text-xs text-fg">{zone.spaces}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <SectionHeader eyebrow="Local rules" title="What security enforces here" />
            <ul className="mt-4 space-y-2.5">
              {lot.rules.map((rule) => (
                <li key={rule} className="flex gap-3 text-xs leading-relaxed text-fg-muted">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-teal" aria-hidden="true" />
                  {rule}
                </li>
              ))}
            </ul>
            <Divider />
            <dl>
              <KeyValue label="Eligibility">
                {lot.eligibility.map((entry) => ELIGIBILITY_LABELS[entry]).join(', ')}
              </KeyValue>
              <KeyValue label="Reservation">{lot.requiresReservation ? 'Required' : 'Not required'}</KeyValue>
              <KeyValue label="Fees">{lot.feeNote}</KeyValue>
              <KeyValue label="Zone">{lot.zone}</KeyValue>
            </dl>
          </Panel>

          <Panel padded={false} className="overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <p className="caps">Position on campus</p>
            </div>
            <CampusMap lots={PARKING_LOTS} activeLotId={lot.id} className="h-64 w-full rounded-none border-0" />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel strength="float" className="lg:sticky lg:top-24">
            <p className="caps">Reserve a bay</p>
            {confirmed ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-ok/40 bg-ok-soft p-4 text-center">
                  <span className="mx-auto flex size-10 items-center justify-center rounded-full border border-ok/50 bg-canvas/40 text-ok">
                    <Check className="size-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-[0.875rem] font-medium text-ok">Reservation confirmed</p>
                  <p className="numeric mt-1 text-[0.6875rem] text-ok">{confirmed.reference}</p>
                </div>
                <dl>
                  <KeyValue label="Area">{confirmed.lotName}</KeyValue>
                  <KeyValue label="Bay">{confirmed.zoneLabel}</KeyValue>
                  <KeyValue label="Date">{formatDate(confirmed.date, 'medium')}</KeyValue>
                  <KeyValue label="Time">
                    {formatTime(confirmed.start)} – {formatTime(confirmed.end)}
                  </KeyValue>
                  <KeyValue label="Vehicle">{confirmed.plate}</KeyValue>
                </dl>
                <InlineNote tone="neutral">
                  Show this reference at the barrier if access is controlled. No payment was collected, and no barrier
                  integration is connected.
                </InlineNote>
                <Button variant="primary" fullWidth onClick={() => navigate('/parking/bookings')}>
                  Manage reservations
                </Button>
                <Button
                  variant="quiet"
                  fullWidth
                  onClick={() => {
                    setConfirmed(null);
                    setStep(0);
                  }}
                >
                  Book another slot
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-4">
                <ProgressSteps steps={STEPS} current={step} />

                {step === 0 ? (
                  <>
                    <Field label="Date" hint="Reservations open 14 days ahead.">
                      <input
                        type="date"
                        value={date}
                        min={todayIso()}
                        max={maxDate}
                        onChange={(event) => setDate(event.target.value)}
                        className="h-11 w-full rounded-xl border border-line bg-[var(--glass-input-bg)] px-3.5 text-sm text-fg"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="From">
                        <Select value={start} onChange={(event) => setStart(event.target.value)}>
                          {TIME_SLOTS.slice(0, -1).map((time) => (
                            <option key={time} value={time}>
                              {formatTime(time)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Until">
                        <Select value={end} onChange={(event) => setEnd(event.target.value)}>
                          {TIME_SLOTS.slice(1).map((time) => (
                            <option key={time} value={time}>
                              {formatTime(time)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                    {hours > 0 ? (
                      <p className="text-[0.6875rem] text-fg-subtle">
                        {hours} hour{hours === 1 ? '' : 's'} · {lot.requiresReservation ? 'Reservation required here' : 'Reservation optional here'}
                      </p>
                    ) : (
                      <InlineNote tone="warn">The end time must be after the start time.</InlineNote>
                    )}
                    {conflict ? (
                      <InlineNote tone="warn" title="You already hold this slot">
                        {conflict.zoneLabel} at {formatTime(conflict.start)}–{formatTime(conflict.end)} on{' '}
                        {formatDate(conflict.date, 'short')}. Overlapping reservations are rejected.
                      </InlineNote>
                    ) : null}
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        setError(null);
                        setStep(1);
                      }}
                      disabled={hours <= 0}
                    >
                      Choose a bay type
                    </Button>
                  </>
                ) : null}

                {step === 1 ? (
                  <>
                    <Field label="Bay type">
                      <div className="flex flex-wrap gap-1.5">
                        {lot.zones.map((zone) => (
                          <FilterPill
                            key={zone.label}
                            active={zoneLabel === zone.label}
                            onClick={() => setZoneLabel(zone.label)}
                            count={zone.spaces}
                          >
                            {zone.label}
                          </FilterPill>
                        ))}
                      </div>
                    </Field>
                    <Field label="Vehicle registration" hint="Shown on the reservation and checked at the barrier.">
                      <TextInput
                        value={plate}
                        onChange={(event) => setPlate(event.target.value)}
                        placeholder="DL 8C AB 4412"
                      />
                    </Field>
                    {lot.occupancy && percent(lot.occupancy.available, lot.capacity) < 10 ? (
                      <InlineNote tone="warn" title="Almost full">
                        Only {lot.occupancy.available} bays are recorded free. Reserve early and have a fallback area in
                        mind.
                      </InlineNote>
                    ) : null}
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setStep(0)}>
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => {
                          setError(null);
                          setStep(2);
                        }}
                        disabled={!plate.trim()}
                      >
                        Review
                      </Button>
                    </div>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <dl className="rounded-xl border border-line bg-surface/50 px-3.5 py-2">
                      <KeyValue label="Area">{lot.name}</KeyValue>
                      <KeyValue label="Bay">{zoneLabel}</KeyValue>
                      <KeyValue label="Date">{formatDate(date, 'medium')}</KeyValue>
                      <KeyValue label="Time">
                        {formatTime(start)} – {formatTime(end)}
                      </KeyValue>
                      <KeyValue label="Vehicle">{plate.toUpperCase()}</KeyValue>
                      <KeyValue label="Fee">{lot.feeNote}</KeyValue>
                    </dl>
                    {!eligible ? (
                      <InlineNote tone="danger" title="Not permitted">
                        Your {profile.parkingEligibility} permit is not accepted in this area, so the reservation will be
                        rejected.
                      </InlineNote>
                    ) : null}
                    {conflict ? (
                      <InlineNote tone="warn" title="Overlapping reservation">
                        You already hold a slot that overlaps this one. Choose another time.
                      </InlineNote>
                    ) : null}
                    {error ? (
                      <InlineNote tone="danger" title="Could not reserve">
                        {error}
                      </InlineNote>
                    ) : null}
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={submit}
                        disabled={!eligible || Boolean(conflict)}
                        icon={<Check className="size-4" />}
                      >
                        Confirm reservation
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button
                size="sm"
                variant={saved ? 'primary' : 'quiet'}
                aria-pressed={saved}
                onClick={() =>
                  toggleSaved({
                    kind: 'parking',
                    refId: lot.id,
                    title: lot.name,
                    subtitle: `${lot.code} · ${lot.capacity} spaces`,
                    href: `/parking/${lot.id}`,
                  })
                }
              >
                {saved ? 'Saved' : 'Save this area'}
              </Button>
              <Link
                to="/parking/bookings"
                className="text-[0.6875rem] font-medium text-accent transition-colors hover:text-accent-hover"
              >
                {activeReservations.length} reservation{activeReservations.length === 1 ? '' : 's'} here
              </Link>
            </div>
          </Panel>

          <Panel strength="quiet">
            <p className="flex items-start gap-2.5 text-xs leading-relaxed text-fg-muted">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
              <span>
                The barrier is operated by campus security. CampusOS cannot open it, register a vehicle or read
                occupancy from sensors — those require authorised integrations that are not configured.
              </span>
            </p>
          </Panel>

          {activeReservations.length > 0 ? (
            <Panel strength="quiet">
              <p className="caps">Reservations in this area</p>
              <ul className="mt-3 space-y-2 text-xs">
                {activeReservations.map((reservation) => (
                  <li key={reservation.id} className="flex items-center justify-between gap-3">
                    <span className="text-fg-muted">
                      {formatDate(reservation.date, 'short')} · {formatTime(reservation.start)}
                    </span>
                    <span className="numeric text-fg-subtle">{reservation.reference}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>

      <SectionHeader
        eyebrow="Nearby"
        title="Other areas you might use"
        description={`Alternatives if ${lot.name} is full or restricted for your permit.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PARKING_LOTS.filter((entry) => entry.id !== lot.id)
          .slice(0, 3)
          .map((entry) => (
            <Panel key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/parking/${entry.id}`} className="text-[0.9375rem] font-medium text-fg hover:text-accent">
                    {entry.name}
                  </Link>
                  <p className="mt-1 text-xs text-fg-subtle">
                    {entry.code} · {entry.capacity} spaces
                  </p>
                </div>
                <Badge tone={availabilityTone(entry)}>
                  {entry.occupancy ? `${entry.occupancy.available} free` : 'No feed'}
                </Badge>
              </div>
              <p className="mt-3 text-[0.6875rem] text-fg-subtle">
                {entry.occupancy
                  ? `Simulated feed · updated ${relativeTime(entry.occupancy.updatedAt)}`
                  : 'Check the entry display before you set off.'}
              </p>
            </Panel>
          ))}
      </div>
    </div>
  );
}
