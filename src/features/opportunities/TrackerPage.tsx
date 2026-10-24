import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarClock, ClipboardList, Compass, ExternalLink, Trash } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { OPPORTUNITIES, TYPE_LABELS } from '@/data/opportunities';
import { deadlineLabel, formatDate, formatDurationWeeks, formatRange, relativeTime } from '@/lib/format';
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
import { Field, Select, TextArea } from '@/components/ui/fields';
import { Modal, Tabs } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/Toast';
import { ModuleHero } from '@/features/shared';
import { STAGE_LABELS, STAGE_ORDER, STAGE_TONE } from './components';
import type { ApplicationStage, Opportunity } from '@/lib/types';

interface TrackedRow {
  opportunity: Opportunity;
  stage: ApplicationStage;
  note: string;
  updatedAt: string;
  reminderAt: string | null;
}

export default function TrackerPage() {
  const toast = useToast();
  const { state, setApplication, removeSaved } = useApp();
  const [tab, setTab] = useState<'active' | 'closed' | 'all'>('active');
  const [editing, setEditing] = useState<TrackedRow | null>(null);
  const [draftStage, setDraftStage] = useState<ApplicationStage>('saved');
  const [draftNote, setDraftNote] = useState('');
  const [draftReminder, setDraftReminder] = useState('');

  const rows = useMemo<TrackedRow[]>(
    () =>
      Object.values(state.applications)
        .map((record) => {
          const opportunity = OPPORTUNITIES.find((entry) => entry.id === record.opportunityId);
          if (!opportunity) return null;
          return {
            opportunity,
            stage: record.stage,
            note: record.note,
            updatedAt: record.updatedAt,
            reminderAt: record.reminderAt,
          };
        })
        .filter(Boolean) as TrackedRow[],
    [state.applications],
  );

  const filtered = useMemo(() => {
    if (tab === 'active') return rows.filter((row) => row.stage !== 'completed');
    if (tab === 'closed') return rows.filter((row) => row.stage === 'completed');
    return rows;
  }, [rows, tab]);

  const closingSoon = useMemo(
    () =>
      rows
        .filter((row) => row.stage !== 'completed')
        .map((row) => ({ row, deadline: deadlineLabel(row.opportunity.deadline) }))
        .filter((entry) => entry.deadline.days >= 0 && entry.deadline.days <= 14)
        .sort((a, b) => a.deadline.days - b.deadline.days),
    [rows],
  );

  const byStage = STAGE_ORDER.map((stage) => ({ stage, count: rows.filter((row) => row.stage === stage).length }));

  function openEditor(row: TrackedRow) {
    setEditing(row);
    setDraftStage(row.stage);
    setDraftNote(row.note);
    setDraftReminder(row.reminderAt ? row.reminderAt.slice(0, 10) : '');
  }

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Travel & work"
        title="Your application tracker"
        description="One place for every role you are considering, preparing for, waiting on or finished with. Stages are yours to set — nothing is inferred from email or any external service."
        tone="teal"
        meta={
          <>
            <Badge tone="accent">{rows.length} tracked</Badge>
            {closingSoon.length > 0 ? <Badge tone="warn">{closingSoon.length} closing within two weeks</Badge> : null}
          </>
        }
        actions={
          <Link
            to="/opportunities"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
          >
            <Compass className="size-4" aria-hidden="true" />
            Discover more
          </Link>
        }
        aside={
          <div className="space-y-3">
            {byStage.map(({ stage, count }) => (
              <div key={stage} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs text-fg-muted">
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      stage === 'completed'
                        ? 'bg-ok'
                        : stage === 'interviewing'
                          ? 'bg-teal'
                          : stage === 'applied'
                            ? 'bg-accent'
                            : stage === 'preparing'
                              ? 'bg-warn'
                              : 'bg-fg-subtle',
                    )}
                    aria-hidden="true"
                  />
                  {STAGE_LABELS[stage]}
                </span>
                <span className="numeric text-xs text-fg">{count}</span>
              </div>
            ))}
          </div>
        }
      />

      {state.saved.filter((item) => item.kind === 'opportunity').length > 0 ? (
        <Panel>
          <SectionHeader
            eyebrow="Saved but not tracked"
            title="Bookmarked opportunities"
            description="Saved items are separate from applications. Add one to the tracker to record its stage and deadline."
          />
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {state.saved
              .filter((item) => item.kind === 'opportunity')
              .map((item) => {
                const opportunity = OPPORTUNITIES.find((entry) => entry.id === item.refId);
                if (!opportunity) return null;
                const tracked = Boolean(state.applications[opportunity.id]);
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/45 p-3"
                  >
                    <div className="min-w-0">
                      <Link to={`/opportunities/${opportunity.id}`} className="block truncate text-[0.8125rem] text-fg hover:text-accent">
                        {opportunity.title}
                      </Link>
                      <p className="mt-0.5 text-[0.6875rem] text-fg-subtle">
                        {opportunity.organisation} · {deadlineLabel(opportunity.deadline).text}
                      </p>
                    </div>
                    {tracked ? (
                      <Badge tone="muted">Tracked</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="quiet"
                        onClick={() => {
                          setApplication(opportunity.id, { stage: 'saved' });
                          toast.success('Added to tracker', 'Stage: Saved.');
                        }}
                      >
                        Track
                      </Button>
                    )}
                  </li>
                );
              })}
          </ul>
        </Panel>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-5" aria-hidden="true" />}
          title="Nothing is being tracked yet"
          description="Add an opportunity to your tracker and it will appear here with its deadline, stage and your private notes."
          action={
            <Link
              to="/opportunities"
              className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
            >
              Browse opportunities
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              ariaLabel="Tracker filters"
              variant="segmented"
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'active', label: 'In progress', count: rows.filter((row) => row.stage !== 'completed').length },
                { value: 'closed', label: 'Closed', count: rows.filter((row) => row.stage === 'completed').length },
                { value: 'all', label: 'Everything', count: rows.length },
              ]}
            />
            <div className="flex gap-3">
              <StatTile label="Closing soon" value={closingSoon.length} hint="Within 14 days" icon={<CalendarClock className="size-4" />} />
            </div>
          </div>

          {closingSoon.length > 0 ? (
            <Panel strength="quiet">
              <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-warn">
                <Bell className="size-4" aria-hidden="true" />
                Deadlines worth acting on
              </p>
              <ul className="mt-3 space-y-2">
                {closingSoon.map(({ row, deadline }) => (
                  <li key={row.opportunity.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <Link to={`/opportunities/${row.opportunity.id}`} className="text-fg hover:text-accent">
                      {row.opportunity.title}
                    </Link>
                    <span className="flex items-center gap-2">
                      <Badge tone={STAGE_TONE[row.stage]}>{STAGE_LABELS[row.stage]}</Badge>
                      <span className={deadline.tone === 'danger' ? 'text-danger' : 'text-warn'}>{deadline.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.6875rem] text-fg-subtle">
                Reminders are computed from listing deadlines only. No email or push notification is sent.
              </p>
            </Panel>
          ) : null}

          <div className="space-y-3">
            {filtered.map((row) => (
              <Panel key={row.opportunity.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={STAGE_TONE[row.stage]}>{STAGE_LABELS[row.stage]}</Badge>
                      <Badge tone="muted">{TYPE_LABELS[row.opportunity.type]}</Badge>
                      <DataOriginTag origin={row.opportunity.origin} />
                    </div>
                    <Link to={`/opportunities/${row.opportunity.id}`} className="mt-2 block">
                      <h3 className="text-[0.9375rem] font-medium text-fg hover:text-accent">{row.opportunity.title}</h3>
                    </Link>
                    <p className="mt-1 text-xs text-fg-muted">
                      {row.opportunity.organisation} · {row.opportunity.location}
                    </p>
                    <p className="numeric mt-2 text-[0.8125rem] text-fg">
                      {formatRange(
                        row.opportunity.compensation.min,
                        row.opportunity.compensation.max,
                        row.opportunity.compensation.currency,
                        row.opportunity.compensation.period,
                      )}{' '}
                      · {formatDurationWeeks(row.opportunity.durationWeeks)}
                    </p>
                    {row.note ? (
                      <p className="mt-3 rounded-lg border border-line bg-surface/50 p-3 text-xs leading-relaxed text-fg-muted">
                        {row.note}
                      </p>
                    ) : null}
                    <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-fg-subtle">
                      <span>Updated {relativeTime(row.updatedAt)}</span>
                      <span className={deadlineLabel(row.opportunity.deadline).tone === 'danger' ? 'text-danger' : ''}>
                        Closes {formatDate(row.opportunity.deadline, 'short')}
                      </span>
                      {row.reminderAt ? <span>Reminder {formatDate(row.reminderAt, 'short')}</span> : null}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                    <Select
                      aria-label={`Stage for ${row.opportunity.title}`}
                      value={row.stage}
                      onChange={(event) => {
                        const stage = event.target.value as ApplicationStage;
                        setApplication(row.opportunity.id, { stage });
                        toast.success(`Moved to ${STAGE_LABELS[stage]}`);
                      }}
                      className="h-9 w-40 text-xs"
                    >
                      {STAGE_ORDER.map((stage) => (
                        <option key={stage} value={stage}>
                          {STAGE_LABELS[stage]}
                        </option>
                      ))}
                    </Select>
                    <Button size="sm" variant="quiet" onClick={() => openEditor(row)}>
                      Notes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<ExternalLink className="size-3.5" />}
                      onClick={() => window.open(row.opportunity.sourceUrl ?? `/opportunities/${row.opportunity.id}`, row.opportunity.sourceUrl ? '_blank' : '_self')}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger"
                      icon={<Trash className="size-3.5" />}
                      onClick={() => {
                        removeSaved(row.opportunity.id);
                        setApplication(row.opportunity.id, { stage: 'saved' });
                        toast.success('Removed from tracker', 'The listing stays in Discover.');
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Application notes"
        description="Private to you and stored in this browser."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!editing) return;
                setApplication(editing.opportunity.id, {
                  stage: draftStage,
                  note: draftNote,
                  reminderAt: draftReminder ? new Date(draftReminder).toISOString() : null,
                });
                toast.success('Tracker updated');
                setEditing(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Stage">
            <Select value={draftStage} onChange={(event) => setDraftStage(event.target.value as ApplicationStage)}>
              {STAGE_ORDER.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note" hint="Interview prep, contacts, follow-up dates.">
            <TextArea value={draftNote} onChange={(event) => setDraftNote(event.target.value)} rows={4} />
          </Field>
          <Field label="Reminder date" hint="Shown in the tracker. No notification is sent.">
            <input
              type="date"
              value={draftReminder}
              onChange={(event) => setDraftReminder(event.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-[var(--glass-input-bg)] px-3.5 text-sm text-fg"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
