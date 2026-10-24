import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  CalendarClock,
  Check,
  Clock,
  Compass,
  ExternalLink,
  Globe,
  Plane,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { OPPORTUNITIES, TYPE_LABELS, VISA_LABELS, EXPERIENCE_LABELS } from '@/data/opportunities';
import { deadlineLabel, formatDate, formatDurationWeeks, formatRange } from '@/lib/format';
import {
  Badge,
  Button,
  DataOriginTag,
  Divider,
  EmptyState,
  InlineNote,
  KeyValue,
  Panel,
  SectionHeader,
} from '@/components/ui/primitives';
import { SmartImage } from '@/components/ui/SmartImage';
import { Field, TextArea } from '@/components/ui/fields';
import { Modal } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/Toast';
import { ReportButton, SaveButton, IntegrationNotice } from '@/features/shared';
import { OpportunityCard, STAGE_LABELS, STAGE_ORDER, STAGE_TONE, TYPE_TONE, VerifiedBadge } from './components';

export default function OpportunityDetailPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, setApplication, advanceApplication } = useApp();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  const opportunity = OPPORTUNITIES.find((entry) => entry.id === opportunityId);
  const application = opportunity ? state.applications[opportunity.id] : undefined;

  if (!opportunity) {
    return (
      <EmptyState
        icon={<Compass className="size-5" aria-hidden="true" />}
        title="That opportunity is no longer listed"
        description="It may have closed or been withdrawn by the organiser. Discover other roles that match your interests."
        action={
          <Link
            to="/opportunities"
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
          >
            Back to discover
          </Link>
        }
      />
    );
  }

  const deadline = deadlineLabel(opportunity.deadline);
  const nextStage = STAGE_ORDER[Math.min(STAGE_ORDER.indexOf(application?.stage ?? 'saved') + 1, STAGE_ORDER.length - 1)];
  const related = OPPORTUNITIES.filter(
    (entry) => entry.id !== opportunity.id && (entry.type === opportunity.type || entry.country === opportunity.country),
  ).slice(0, 3);

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
          <SmartImage
            src={opportunity.image}
            alt=""
            ratio="21 / 9"
            sizes="(max-width: 1024px) 100vw, 1100px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/50 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={TYPE_TONE[opportunity.type]}>{TYPE_LABELS[opportunity.type]}</Badge>
              {opportunity.remote ? <Badge tone="teal">Remote</Badge> : null}
              <VerifiedBadge opportunity={opportunity} />
              <DataOriginTag origin={opportunity.origin} />
            </div>
            <h1 className="display mt-3 text-[1.875rem] leading-tight text-fg sm:text-[2.5rem]">
              {opportunity.title}
            </h1>
            <p className="mt-2 text-[0.9375rem] text-fg-muted">
              {opportunity.organisation} · {opportunity.location}
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-5">
          <Panel>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="caps">Compensation</p>
                <p className="numeric mt-1.5 text-[0.9375rem] text-fg">
                  {formatRange(
                    opportunity.compensation.min,
                    opportunity.compensation.max,
                    opportunity.compensation.currency,
                    opportunity.compensation.period,
                  )}
                </p>
                {opportunity.compensation.note ? (
                  <p className="mt-1 text-[0.6875rem] leading-relaxed text-fg-subtle">{opportunity.compensation.note}</p>
                ) : null}
              </div>
              <div>
                <p className="caps">Duration</p>
                <p className="mt-1.5 text-[0.9375rem] text-fg">{formatDurationWeeks(opportunity.durationWeeks)}</p>
                <p className="mt-1 text-[0.6875rem] text-fg-subtle">{opportunity.hoursPerWeek} hours per week</p>
              </div>
              <div>
                <p className="caps">Start date</p>
                <p className="mt-1.5 text-[0.9375rem] text-fg">{formatDate(opportunity.startDate, 'medium')}</p>
                <p className="mt-1 text-[0.6875rem] text-fg-subtle">As stated by the organiser</p>
              </div>
              <div>
                <p className="caps">Applications close</p>
                <p
                  className={`mt-1.5 text-[0.9375rem] ${
                    deadline.tone === 'danger' ? 'text-danger' : deadline.tone === 'warn' ? 'text-warn' : 'text-fg'
                  }`}
                >
                  {formatDate(opportunity.deadline, 'medium')}
                </p>
                <p className="mt-1 text-[0.6875rem] text-fg-subtle">{deadline.text}</p>
              </div>
            </div>

            <Divider />

            <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-fg-muted">
              {opportunity.description}
            </p>
          </Panel>

          <Panel>
            <SectionHeader eyebrow="What you would do" title="Responsibilities" />
            <ul className="mt-4 space-y-2.5">
              {opportunity.responsibilities.map((item) => (
                <li key={item} className="flex gap-3 text-[0.875rem] leading-relaxed text-fg-muted">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Divider />
            <SectionHeader eyebrow="Eligibility" title="Requirements" />
            <ul className="mt-4 space-y-2.5">
              {opportunity.requirements.map((item) => (
                <li key={item} className="flex gap-3 text-[0.875rem] leading-relaxed text-fg-muted">
                  <Check className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2">
            <Panel>
              <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
                <BedDouble className="size-4 text-accent" aria-hidden="true" />
                Accommodation
              </p>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                {opportunity.accommodation ?? 'Not stated by the organiser. Budget for your own housing.'}
              </p>
            </Panel>
            <Panel>
              <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
                <Plane className="size-4 text-accent" aria-hidden="true" />
                Travel support
              </p>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                {opportunity.travelSupport ?? 'Not stated by the organiser. Assume travel is self-funded.'}
              </p>
            </Panel>
          </div>

          <Panel>
            <SectionHeader
              eyebrow="Provenance"
              title="Where this listing came from"
              description="CampusOS states its sources rather than implying an endorsement it does not have."
            />
            <dl className="mt-4">
              <KeyValue label="Source">{opportunity.sourceName}</KeyValue>
              <KeyValue label="Posted">{formatDate(opportunity.postedAt, 'medium')}</KeyValue>
              <KeyValue label="Verification">
                {opportunity.verified ? 'Organiser supplies verification' : 'Not verified — demonstration listing'}
              </KeyValue>
              <KeyValue label="Work authorisation">{VISA_LABELS[opportunity.visaSupport]}</KeyValue>
              <KeyValue label="Experience">{EXPERIENCE_LABELS[opportunity.experience]}</KeyValue>
            </dl>
            {opportunity.sourceUrl ? (
              <a
                href={opportunity.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
              >
                Open the original listing
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              <InlineNote tone="neutral" className="mt-4">
                No external source is recorded for this listing. Treat the details as unconfirmed and check the
                organisation independently before applying.
              </InlineNote>
            )}
          </Panel>

          <IntegrationNotice integrationId="opportunities" />
        </div>

        <div className="space-y-4">
          <Panel strength="float" className="lg:sticky lg:top-24">
            <p className="caps">Application</p>
            {application ? (
              <>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Badge tone={STAGE_TONE[application.stage]}>{STAGE_LABELS[application.stage]}</Badge>
                  <span className="text-[0.6875rem] text-fg-subtle">
                    Updated {formatDate(application.updatedAt, 'short')}
                  </span>
                </div>
                {application.note ? (
                  <p className="mt-3 rounded-lg border border-line bg-surface/50 p-3 text-xs leading-relaxed text-fg-muted">
                    {application.note}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-2.5 text-xs leading-relaxed text-fg-muted">
                Not tracked yet. Saving it here keeps the deadline, notes and stage in one place.
              </p>
            )}

            <div className="mt-5 space-y-2">
              {!application ? (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setApplication(opportunity.id, { stage: 'saved' });
                    toast.success('Added to your tracker', 'Stage: Saved.');
                  }}
                >
                  Add to tracker
                </Button>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    advanceApplication(opportunity.id, nextStage);
                    toast.success(`Moved to ${STAGE_LABELS[nextStage]}`, 'Updated in your tracker.');
                  }}
                  disabled={application.stage === 'completed'}
                >
                  {application.stage === 'completed' ? 'Completed' : `Move to ${STAGE_LABELS[nextStage]}`}
                </Button>
              )}
              <SaveButton
                kind="opportunity"
                refId={opportunity.id}
                title={opportunity.title}
                subtitle={`${opportunity.organisation} · ${opportunity.country}`}
                href={`/opportunities/${opportunity.id}`}
                variant="secondary"
                className="w-full"
              />
              {application ? (
                <Button variant="quiet" fullWidth onClick={() => setNoteOpen(true)}>
                  {application.note ? 'Edit note' : 'Add a note'}
                </Button>
              ) : null}
            </div>

            <Divider />

            <ul className="space-y-3 text-[0.6875rem] leading-relaxed text-fg-muted">
              <li className="flex gap-2">
                <Clock className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                {opportunity.hoursPerWeek} hours per week for {formatDurationWeeks(opportunity.durationWeeks)}
              </li>
              <li className="flex gap-2">
                <Globe className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                {opportunity.remote ? 'Remote — work from anywhere with a connection' : opportunity.location}
              </li>
              <li className="flex gap-2">
                <Wallet className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                Payment is handled by the organiser. CampusOS collects nothing.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                Visa outcomes are never guaranteed by CampusOS.
              </li>
            </ul>

            <div className="mt-4 border-t border-line pt-3">
              <ReportButton kind="opportunity" refId={opportunity.id} refLabel={opportunity.title} />
            </div>
          </Panel>

          <Panel strength="quiet">
            <p className="caps">Tags</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opportunity.tags.map((tag) => (
                <Badge key={tag} tone="muted">
                  {tag}
                </Badge>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {related.length > 0 ? (
        <Panel>
          <SectionHeader
            eyebrow="Similar"
            title="Other listings like this"
            description="Matched on opportunity type or country."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((entry) => (
              <OpportunityCard key={entry.id} opportunity={entry} stage={state.applications[entry.id]?.stage} />
            ))}
          </div>
        </Panel>
      ) : null}

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Notes on this application"
        description="Private to you. Useful for interview prep, contacts and follow-up dates."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setApplication(opportunity.id, { note });
                toast.success('Note saved');
                setNoteOpen(false);
              }}
            >
              Save note
            </Button>
          </>
        }
      >
        <Field label="Your note" hint="Stored in this browser only.">
          <TextArea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={5}
            autoFocus
            placeholder="Interview on the 14th at 10:00. Follow up with the design lead about the portfolio format."
          />
        </Field>
      </Modal>

      <div className="flex items-center gap-2 text-[0.6875rem] text-fg-subtle">
        <CalendarClock className="size-3" aria-hidden="true" />
        Closing {formatDate(opportunity.deadline, 'medium')} · Listed {formatDate(opportunity.postedAt, 'short')}
      </div>
    </div>
  );
}
