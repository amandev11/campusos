import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Accessibility, Car, Info, MapPin, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { PARKING_LOTS, PARKING_RULES_SUMMARY, PEAK_HOURS_NOTE, ELIGIBILITY_LABELS } from '@/data/parking';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Badge,
  Button,
  DataOriginTag,
  EmptyState,
  Panel,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { SearchField } from '@/components/ui/fields';
import { IntegrationNotice, ModuleHero } from '@/features/shared';
import { AvailabilityFigure, CampusMap, LotCard, ParkingStats, availabilityTone } from './components';
import type { ParkingEligibility } from '@/lib/types';

export default function ParkingPage() {
  const { state, profile, isSaved } = useApp();
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState<'all' | 'student' | 'faculty' | 'visitor' | 'mixed'>('all');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [onlyReservable, setOnlyReservable] = useState(false);
  const [activeLot, setActiveLot] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');

  const eligibility = profile.parkingEligibility;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PARKING_LOTS.filter((lot) => {
      if (zone !== 'all' && lot.zone !== zone) return false;
      if (onlyEligible && !lot.eligibility.includes(eligibility)) return false;
      if (onlyReservable && !lot.requiresReservation) return false;
      if (needle.length > 0) {
        const haystack = `${lot.name} ${lot.code} ${lot.zone} ${lot.hours} ${lot.rules.join(' ')} ${Object.keys(lot.walkMinutes).join(' ')}`.toLowerCase();
        if (!needle.split(/\s+/).every((term) => haystack.includes(term))) return false;
      }
      return true;
    });
  }, [query, zone, onlyEligible, onlyReservable, eligibility]);

  const upcoming = useMemo(
    () =>
      state.reservations
        .filter((reservation) => reservation.status === 'confirmed')
        .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)),
    [state.reservations],
  );

  const reported = PARKING_LOTS.filter((lot) => lot.occupancy);
  const freeNow = reported.reduce((sum, lot) => sum + (lot.occupancy?.available ?? 0), 0);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Campus parking"
        title="Find a space before you leave the hostel"
        description="Every parking area on both campuses with its capacity, eligibility rules, operating hours and walk times — plus the availability a feed actually reports, labelled honestly."
        tone="teal"
        meta={
          <>
            <Badge tone="teal">{PARKING_LOTS.length} areas</Badge>
            <Badge tone="accent">{PARKING_LOTS.reduce((sum, lot) => sum + lot.capacity, 0)} spaces</Badge>
            <Badge tone="muted">Your permit: {ELIGIBILITY_LABELS[eligibility]}</Badge>
            <DataOriginTag origin="demo" />
          </>
        }
        actions={
          <>
            <Link
              to="/parking/bookings"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
            >
              My reservations
              {upcoming.length > 0 ? <span className="numeric text-xs opacity-80">({upcoming.length})</span> : null}
            </Link>
            {profile.vehicleLabel ? (
              <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 numeric text-xs text-fg-muted">
                <Car className="size-4 text-fg-subtle" aria-hidden="true" />
                {profile.vehicleLabel}
              </span>
            ) : (
              <Link
                to="/settings"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
              >
                Add a vehicle
              </Link>
            )}
          </>
        }
        aside={
          <div className="space-y-3">
            <SearchField
              value={query}
              onChange={setQuery}
              size="lg"
              placeholder="Area, code or walking destination"
              label="Search parking areas"
            />
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Free (simulated)"
                value={freeNow}
                hint={`${reported.length} of ${PARKING_LOTS.length} areas report a feed`}
                tone="accent"
              />
              <StatTile
                label="Your reservations"
                value={upcoming.length}
                hint={upcoming[0] ? `Next ${upcoming[0].date} ${upcoming[0].start}` : 'Nothing booked'}
              />
            </div>
          </div>
        }
      />

      <IntegrationNotice integrationId="parking" />

      <Panel strength="quiet">
        <p className="flex items-start gap-2.5 text-xs leading-relaxed text-fg-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
          <span>{PEAK_HOURS_NOTE}</span>
        </p>
      </Panel>

      <ParkingStats lots={PARKING_LOTS} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-line p-0.5">
          {(['map', 'list'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={view === option}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                view === option ? 'bg-surface/80 text-fg' : 'text-fg-subtle hover:text-fg',
              )}
            >
              {option} view
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZone('all')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-colors',
              zone === 'all' ? 'border-accent/50 bg-accent-soft text-accent' : 'border-line text-fg-muted hover:text-fg',
            )}
          >
            All zones
          </button>
          {(['student', 'faculty', 'visitor', 'mixed'] as const).map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setZone(entry)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs capitalize transition-colors',
                zone === entry ? 'border-accent/50 bg-accent-soft text-accent' : 'border-line text-fg-muted hover:text-fg',
              )}
            >
              {entry}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOnlyEligible((current) => !current)}
            aria-pressed={onlyEligible}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
              onlyEligible ? 'border-teal/45 bg-teal-soft text-teal' : 'border-line text-fg-muted hover:text-fg',
            )}
          >
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            My permit
          </button>
          <button
            type="button"
            onClick={() => setOnlyReservable((current) => !current)}
            aria-pressed={onlyReservable}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
              onlyReservable ? 'border-accent/50 bg-accent-soft text-accent' : 'border-line text-fg-muted hover:text-fg',
            )}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            Reservation required
          </button>
        </div>
      </div>

      {view === 'map' ? (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Panel padded={false} className="overflow-hidden">
            <CampusMap
              lots={filtered}
              activeLotId={activeLot}
              onSelect={(id) => setActiveLot(id)}
              className="h-[26rem] w-full rounded-none border-0"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
              <p className="text-[0.6875rem] text-fg-subtle">
                Positions are illustrative, not geo-referenced. A campus map service is not connected.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[0.625rem]">
                <span className="flex items-center gap-1.5 text-fg-subtle">
                  <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" />
                  Plenty free
                </span>
                <span className="flex items-center gap-1.5 text-fg-subtle">
                  <span className="size-1.5 rounded-full bg-warn" aria-hidden="true" />
                  Filling up
                </span>
                <span className="flex items-center gap-1.5 text-fg-subtle">
                  <span className="size-1.5 rounded-full bg-danger" aria-hidden="true" />
                  Nearly full
                </span>
                <span className="flex items-center gap-1.5 text-fg-subtle">
                  <span className="size-1.5 rounded-full bg-fg-subtle" aria-hidden="true" />
                  No feed
                </span>
              </div>
            </div>
          </Panel>

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<MapPin className="size-5" aria-hidden="true" />}
                title="No areas match"
                description="Clear the permit or reservation filter to see every parking area on campus."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setOnlyEligible(false);
                      setOnlyReservable(false);
                      setZone('all');
                      setQuery('');
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              filtered.slice(0, 4).map((lot) => (
                <div key={lot.id} className={cn('rounded-2xl', activeLot === lot.id && 'ring-1 ring-accent/40')}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <Link to={`/parking/${lot.id}`} className="text-[0.8125rem] font-medium text-fg hover:text-accent">
                      {lot.name}
                    </Link>
                    <Badge tone={availabilityTone(lot)}>{lot.code}</Badge>
                  </div>
                  <AvailabilityFigure lot={lot} />
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.625rem] text-fg-subtle">
                    <span className="flex items-center gap-1">
                      <Accessibility className="size-3" aria-hidden="true" />
                      {lot.accessibleSpaces}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="size-3" aria-hidden="true" />
                      {lot.evSpaces}
                    </span>
                    <span className="truncate">{lot.hours}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lot) => (
            <LotCard key={lot.id} lot={lot} isSaved={isSaved(lot.id)} />
          ))}
        </div>
      )}

      {filtered.length === 0 && view === 'list' ? (
        <EmptyState
          icon={<MapPin className="size-5" aria-hidden="true" />}
          title="No parking areas match"
          description="Try clearing the filters — student, faculty and visitor areas are all listed here."
        />
      ) : null}

      <Panel>
        <SectionHeader
          eyebrow="Rules"
          title="Campus parking policy"
          description="Applied by campus security. CampusOS shows the rules; it does not enforce them without an integration."
        />
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARKING_RULES_SUMMARY.map((rule) => (
            <li key={rule} className="flex gap-3 text-xs leading-relaxed text-fg-muted">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              {rule}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <SectionHeader
          eyebrow="Eligibility"
          title="Who can park where"
          description="Matched against the permit recorded on your profile."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PARKING_LOTS.map((lot) => {
            const allowed = lot.eligibility.includes(eligibility);
            return (
              <div
                key={lot.id}
                className={cn(
                  'rounded-xl border p-3.5',
                  allowed ? 'border-ok/30 bg-ok-soft' : 'border-line bg-surface/45',
                )}
              >
                <p className="flex items-center justify-between gap-2 text-[0.8125rem] text-fg">
                  <Link to={`/parking/${lot.id}`} className="truncate hover:text-accent">
                    {lot.name}
                  </Link>
                  <Badge tone={allowed ? 'ok' : 'muted'}>{allowed ? 'You' : 'Restricted'}</Badge>
                </p>
                <p className="mt-1.5 text-[0.6875rem] text-fg-subtle">
                  {lot.eligibility.map((entry) => ELIGIBILITY_LABELS[entry]).join(' · ')}
                </p>
                {lot.occupancy ? (
                  <p className="mt-1.5 text-[0.6875rem] text-fg-subtle">
                    Simulated feed updated {relativeTime(lot.occupancy.updatedAt)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-[0.6875rem] text-fg-subtle">
          Permit type: {ELIGIBILITY_LABELS[eligibility as ParkingEligibility]}. Change it in Settings if your situation
          changes.
        </p>
      </Panel>
    </div>
  );
}
