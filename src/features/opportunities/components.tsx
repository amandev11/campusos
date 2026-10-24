import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  BedDouble,
  CalendarClock,
  Clock,
  Globe,
  MapPin,
  Plane,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { TYPE_LABELS, VISA_LABELS, EXPERIENCE_LABELS } from '@/data/opportunities';
import { deadlineLabel, formatDate, formatDurationWeeks, formatRange } from '@/lib/format';
import { cn } from '@/lib/cn';
import { SmartImage } from '@/components/ui/SmartImage';
import { Badge, DataOriginTag, type Tone } from '@/components/ui/primitives';
import { SaveButton } from '@/features/shared';
import type { ApplicationStage, Opportunity, OpportunityType } from '@/lib/types';

export const TYPE_TONE: Record<OpportunityType, Tone> = {
  internship: 'accent',
  'part-time': 'teal',
  'full-time': 'accent',
  remote: 'teal',
  teaching: 'warn',
  seasonal: 'warn',
  adventure: 'ok',
  hospitality: 'ok',
  'work-exchange': 'muted',
  volunteer: 'muted',
  programme: 'accent',
};

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  saved: 'Saved',
  preparing: 'Preparing',
  applied: 'Applied',
  interviewing: 'Interviewing',
  completed: 'Completed',
};

export const STAGE_ORDER: ApplicationStage[] = ['saved', 'preparing', 'applied', 'interviewing', 'completed'];

export const STAGE_TONE: Record<ApplicationStage, Tone> = {
  saved: 'muted',
  preparing: 'warn',
  applied: 'accent',
  interviewing: 'teal',
  completed: 'ok',
};

export function VisaBadge({ opportunity }: { opportunity: Opportunity }) {
  const tone: Tone =
    opportunity.visaSupport === 'sponsored'
      ? 'teal'
      : opportunity.visaSupport === 'eligible'
        ? 'accent'
        : opportunity.visaSupport === 'unknown'
          ? 'warn'
          : 'muted';
  return (
    <Badge tone={tone} icon={<ShieldCheck className="size-3" aria-hidden="true" />}>
      {VISA_LABELS[opportunity.visaSupport]}
    </Badge>
  );
}

export function VerifiedBadge({ opportunity }: { opportunity: Opportunity }) {
  if (!opportunity.verified) return null;
  return (
    <Badge tone="teal" icon={<BadgeCheck className="size-3" aria-hidden="true" />}>
      Organiser verified
    </Badge>
  );
}

export function OpportunityCard({
  opportunity,
  layout = 'grid',
  stage,
}: {
  opportunity: Opportunity;
  layout?: 'grid' | 'row' | 'feature';
  stage?: ApplicationStage;
}) {
  const deadline = deadlineLabel(opportunity.deadline);

  if (layout === 'feature') {
    return (
      <article className="group relative overflow-hidden rounded-2xl border border-line bg-surface/40">
        <SmartImage
          src={opportunity.image}
          alt={opportunity.title}
          ratio="16 / 9"
          sizes="(max-width: 1024px) 100vw, 620px"
          className="transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/55 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={TYPE_TONE[opportunity.type]}>{TYPE_LABELS[opportunity.type]}</Badge>
            {opportunity.remote ? <Badge tone="teal">Remote</Badge> : null}
            <VerifiedBadge opportunity={opportunity} />
          </div>
          <Link to={`/opportunities/${opportunity.id}`} className="mt-3 block">
            <h3 className="display text-[1.5rem] leading-tight text-fg transition-colors group-hover:text-accent sm:text-[1.75rem]">
              {opportunity.title}
            </h3>
          </Link>
          <p className="mt-1.5 text-[0.8125rem] text-fg-muted">
            {opportunity.organisation} · {opportunity.location}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-muted">
            <span className="flex items-center gap-1.5">
              <Wallet className="size-3.5 text-fg-subtle" aria-hidden="true" />
              {formatRange(
                opportunity.compensation.min,
                opportunity.compensation.max,
                opportunity.compensation.currency,
                opportunity.compensation.period,
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-fg-subtle" aria-hidden="true" />
              <span className={cn(deadline.tone === 'danger' && 'text-danger', deadline.tone === 'warn' && 'text-warn')}>
                {deadline.text}
              </span>
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (layout === 'row') {
    return (
      <article className="group relative flex gap-4 rounded-2xl border border-line bg-surface/40 p-3 transition-all duration-300 hover:border-line-strong hover:bg-surface/60 sm:p-4">
        <Link to={`/opportunities/${opportunity.id}`} className="hidden w-40 shrink-0 sm:block" aria-label={opportunity.title}>
          <SmartImage src={opportunity.image} alt="" ratio="4 / 3" sizes="160px" wrapperClassName="rounded-xl" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <Badge tone={TYPE_TONE[opportunity.type]}>{TYPE_LABELS[opportunity.type]}</Badge>
                {stage ? <Badge tone={STAGE_TONE[stage]}>{STAGE_LABELS[stage]}</Badge> : null}
                <VerifiedBadge opportunity={opportunity} />
              </div>
              <Link to={`/opportunities/${opportunity.id}`}>
                <h3 className="text-[0.9375rem] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
                  {opportunity.title}
                </h3>
              </Link>
              <p className="mt-1 text-xs text-fg-muted">
                {opportunity.organisation} · {opportunity.location}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="numeric text-[0.875rem] text-fg">
                {formatRange(
                  opportunity.compensation.min,
                  opportunity.compensation.max,
                  opportunity.compensation.currency,
                  opportunity.compensation.period,
                )}
              </p>
              <p
                className={cn(
                  'mt-1 text-[0.6875rem]',
                  deadline.tone === 'danger' ? 'text-danger' : deadline.tone === 'warn' ? 'text-warn' : 'text-fg-subtle',
                )}
              >
                {deadline.text}
              </p>
            </div>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 text-[0.6875rem] text-fg-subtle">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3" aria-hidden="true" />
              {opportunity.hoursPerWeek} hrs/week · {formatDurationWeeks(opportunity.durationWeeks)}
            </span>
            {opportunity.accommodation ? (
              <span className="flex items-center gap-1.5">
                <BedDouble className="size-3" aria-hidden="true" />
                Housing included
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <Globe className="size-3" aria-hidden="true" />
              Starts {formatDate(opportunity.startDate, 'short')}
            </span>
            <DataOriginTag origin={opportunity.origin} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/40 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-elev-3">
      <Link to={`/opportunities/${opportunity.id}`} aria-label={opportunity.title}>
        <SmartImage
          src={opportunity.image}
          alt=""
          ratio="16 / 10"
          sizes="(max-width: 640px) 90vw, 340px"
          className="transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={TYPE_TONE[opportunity.type]}>{TYPE_LABELS[opportunity.type]}</Badge>
          {opportunity.remote ? <Badge tone="teal">Remote</Badge> : null}
          {stage ? <Badge tone={STAGE_TONE[stage]}>{STAGE_LABELS[stage]}</Badge> : null}
        </div>
        <Link to={`/opportunities/${opportunity.id}`} className="mt-2.5 block">
          <h3 className="line-clamp-2 text-[0.9375rem] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
            {opportunity.title}
          </h3>
        </Link>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-fg-muted">
          <MapPin className="size-3 shrink-0 text-fg-subtle" aria-hidden="true" />
          <span className="truncate">
            {opportunity.organisation} · {opportunity.country === 'Remote' ? 'Remote' : opportunity.country}
          </span>
        </p>
        <p className="numeric mt-3 text-[0.875rem] text-fg">
          {formatRange(
            opportunity.compensation.min,
            opportunity.compensation.max,
            opportunity.compensation.currency,
            opportunity.compensation.period,
          )}
        </p>
        <p className="mt-1 text-[0.6875rem] text-fg-subtle">
          {opportunity.hoursPerWeek} hrs/week · {formatDurationWeeks(opportunity.durationWeeks)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
          <span
            className={cn(
              'text-[0.6875rem]',
              deadline.tone === 'danger' ? 'text-danger' : deadline.tone === 'warn' ? 'text-warn' : 'text-fg-subtle',
            )}
          >
            {deadline.text}
          </span>
          <SaveButton
            kind="opportunity"
            refId={opportunity.id}
            title={opportunity.title}
            subtitle={`${opportunity.organisation} · ${opportunity.country}`}
            href={`/opportunities/${opportunity.id}`}
            size="sm"
            variant="ghost"
            withLabel={false}
          />
        </div>
      </div>
    </article>
  );
}

/** Describes, honestly, why an opportunity is being suggested. */
export function MatchReason({ opportunity, interests }: { opportunity: Opportunity; interests: string[] }) {
  const matched = useMemo(
    () =>
      interests.filter((interest) =>
        opportunity.categories.some((category) => category.toLowerCase().includes(interest.toLowerCase())) ||
        opportunity.tags.some((tag) => tag.toLowerCase().includes(interest.toLowerCase())),
      ),
    [opportunity, interests],
  );

  const text =
    matched.length > 0
      ? `Matches your interest in ${matched.slice(0, 2).join(' and ')}`
      : `Newly listed in ${TYPE_LABELS[opportunity.type].toLowerCase()}`;

  return (
    <p className="flex items-center gap-1.5 text-[0.6875rem] text-teal">
      <Plane className="size-3" aria-hidden="true" />
      {text}
    </p>
  );
}

export function ExperienceLine({ opportunity }: { opportunity: Opportunity }) {
  return <span className="text-xs text-fg-muted">{EXPERIENCE_LABELS[opportunity.experience]}</span>;
}
