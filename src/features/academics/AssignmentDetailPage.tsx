import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ClipboardList,
  FileText,
  GraduationCap,
  Paperclip,
  Send,
  Upload,
} from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { courseByCode } from '@/data/academics';
import { deadlineLabel, formatBytes, formatDate, formatTime, relativeTime } from '@/lib/format';
import {
  Badge,
  Button,
  DataOriginTag,
  Divider,
  EmptyState,
  InlineNote,
  KeyValue,
  Meter,
  Panel,
  SectionHeader,
} from '@/components/ui/primitives';
import { Checkbox, Field, TextArea, TextInput } from '@/components/ui/fields';
import { ConfirmDialog } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/Toast';
import { ACCEPTED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, validateDocument } from '@/lib/images';
import { CourseChip } from './components';

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, assignments, documents, submitAssignment, gradeSubmission, profile } = useApp();

  const assignment = assignments.find((entry) => entry.id === assignmentId);
  const submission = assignment ? state.submissions[assignment.id] : undefined;
  const attachment = assignment?.attachmentId
    ? documents.find((document) => document.id === assignment.attachmentId)
    : undefined;

  const [method, setMethod] = useState<'file' | 'text'>('file');
  const [fileName, setFileName] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [declared, setDeclared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  if (!assignment) {
    return (
      <EmptyState
        icon={<ClipboardList className="size-5" aria-hidden="true" />}
        title="That assignment is no longer available"
        description="It may have been withdrawn by the course faculty. Other work for your courses is listed under Assignments."
        action={
          <Link
            to="/academics/assignments"
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
          >
            Back to assignments
          </Link>
        }
      />
    );
  }

  const course = courseByCode(assignment.courseCode);
  const deadline = deadlineLabel(assignment.dueAt);
  const isFaculty = profile.role === 'faculty' || profile.role === 'admin';

  function pickFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const check = validateDocument(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setFileName(file.name);
    setError(null);
  }

  function handleSubmit() {
    if (!declared) {
      setError('Confirm that the work is your own before submitting.');
      return;
    }
    const result = submitAssignment({
      assignmentId: assignment!.id,
      method,
      fileName,
      note,
      wordCount: 0,
    });
    if (!result.ok) {
      setError(result.error ?? 'Could not submit.');
      return;
    }
    setError(null);
    setConfirmSubmit(false);
    toast.success('Assignment submitted', 'Stored in this browser. Your faculty member is not emailed.');
  }

  function handleGrade() {
    const value = Number(marks);
    const result = gradeSubmission(assignment!.id, value, feedback);
    if (!result.ok) {
      setError(result.error ?? 'Could not save the mark.');
      return;
    }
    setError(null);
    toast.success('Mark saved', 'Visible to the submitting account in this browser.');
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

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
          <Panel>
            <div className="flex flex-wrap items-center gap-1.5">
              <CourseChip code={assignment.courseCode} />
              <Badge tone="muted">{assignment.maxMarks} marks</Badge>
              <DataOriginTag origin={assignment.origin} />
              {submission ? (
                <Badge tone={submission.marks == null ? 'accent' : 'ok'}>
                  {submission.marks == null ? 'Submitted' : `Graded ${submission.marks}/${assignment.maxMarks}`}
                </Badge>
              ) : deadline.tone === 'danger' ? (
                <Badge tone="danger">{deadline.text}</Badge>
              ) : (
                <Badge tone={deadline.tone === 'warn' ? 'warn' : 'muted'}>{deadline.text}</Badge>
              )}
            </div>

            <h1 className="display mt-4 text-[1.75rem] leading-tight text-fg sm:text-[2.125rem]">{assignment.title}</h1>
            <p className="mt-2 text-[0.8125rem] text-fg-muted">
              {course?.title} · set by {assignment.createdBy}
            </p>

            <p className="mt-5 whitespace-pre-line text-[0.9375rem] leading-relaxed text-fg-muted">{assignment.brief}</p>

            {attachment ? (
              <Link
                to={`/academics/library/${attachment.id}`}
                className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-surface/45 p-3.5 transition-colors hover:border-line-strong"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface/60 text-accent">
                  <Paperclip className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.8125rem] font-medium text-fg">{attachment.title}</span>
                  <span className="mt-0.5 block text-[0.6875rem] text-fg-subtle">
                    {attachment.pages} pages · {formatBytes(attachment.sizeKb)} · open the viewer
                  </span>
                </span>
              </Link>
            ) : null}
          </Panel>

          {submission?.feedback ? (
            <Panel className="border-teal/35">
              <SectionHeader
                eyebrow="Feedback"
                title={submission.marks != null ? `${submission.marks} / ${assignment.maxMarks}` : 'Awaiting marks'}
              />
              <p className="mt-3 text-[0.875rem] leading-relaxed text-fg-muted">{submission.feedback}</p>
            </Panel>
          ) : null}

          {isFaculty ? (
            <Panel>
              <SectionHeader
                eyebrow="Grading"
                title={submission ? 'Mark this submission' : 'No submission yet'}
                description="Marks entered here are stored in this browser only. A real gradebook would be enforced server-side."
              />
              {submission ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-line bg-surface/45 p-3.5">
                    <p className="caps">Submitted</p>
                    <p className="mt-1.5 text-[0.8125rem] text-fg">
                      {formatDate(submission.submittedAt, 'medium')} at{' '}
                      {formatTime(new Date(submission.submittedAt).toTimeString().slice(0, 5))}
                      <span className="ml-2 text-fg-subtle">({relativeTime(submission.submittedAt)})</span>
                    </p>
                    <p className="mt-1 text-[0.6875rem] text-fg-subtle">
                      {submission.method === 'file'
                        ? `File: ${submission.fileName ?? 'not recorded'}`
                        : `Written response, ${submission.wordCount} words`}
                    </p>
                  </div>
                  {submission.note ? (
                    <p className="rounded-xl border border-line bg-surface/45 p-3.5 text-xs leading-relaxed text-fg-muted">
                      {submission.note}
                    </p>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                    <Field label={`Mark out of ${assignment.maxMarks}`} error={error}>
                      <TextInput
                        type="number"
                        min={0}
                        max={assignment.maxMarks}
                        value={marks}
                        onChange={(event) => setMarks(event.target.value)}
                        placeholder={String(Math.round(assignment.maxMarks * 0.8))}
                      />
                    </Field>
                    <Field label="Feedback" hint="Returned to the student alongside the mark.">
                      <TextArea
                        value={feedback}
                        onChange={(event) => setFeedback(event.target.value)}
                        rows={3}
                        placeholder="Clear methodology. The annotated example is stronger than the written section — lead with it next time."
                      />
                    </Field>
                  </div>
                  <Button variant="primary" onClick={handleGrade} icon={<GraduationCap className="size-4" />}>
                    Save mark and feedback
                  </Button>
                </div>
              ) : (
                <EmptyState
                  title="Nothing has been handed in"
                  description="Submissions appear here as soon as students submit through CampusOS."
                  className="mt-5 border-none py-6"
                />
              )}
            </Panel>
          ) : (
            <Panel>
              <SectionHeader
                eyebrow="Your submission"
                title={submission ? 'Submitted' : 'Hand this in'}
                description={
                  submission
                    ? 'You can resubmit until the deadline. A resubmission replaces the previous one.'
                    : 'Attach a PDF or write your response directly. Both are stored in this browser only.'
                }
              />
              <div className="mt-5 space-y-4">
                {submission ? (
                  <div className="rounded-xl border border-ok/35 bg-ok-soft p-3.5">
                    <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ok">
                      <Check className="size-4" aria-hidden="true" />
                      Submitted {relativeTime(submission.submittedAt)}
                    </p>
                    <p className="mt-1 text-[0.6875rem] text-ok">
                      {submission.method === 'file' ? submission.fileName ?? 'File upload' : `${submission.wordCount} words`}
                    </p>
                  </div>
                ) : null}

                <div className="flex rounded-lg border border-line p-0.5">
                  {(['file', 'text'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMethod(option)}
                      aria-pressed={method === option}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        method === option ? 'bg-surface/80 text-fg' : 'text-fg-subtle hover:text-fg'
                      }`}
                    >
                      {option === 'file' ? 'Upload a PDF' : 'Write a response'}
                    </button>
                  ))}
                </div>

                {method === 'file' ? (
                  <Field label="PDF file" hint={`PDF only, up to ${Math.round(MAX_DOCUMENT_BYTES / 1024 / 1024)} MB.`}>
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line py-8 text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted">
                      <Upload className="size-5" aria-hidden="true" />
                      <span className="text-xs">{fileName ?? 'Choose a PDF'}</span>
                      <span className="text-[0.6875rem]">Nothing is uploaded to a server</span>
                      <input
                        type="file"
                        accept={ACCEPTED_DOCUMENT_TYPES.join(',')}
                        className="sr-only"
                        onChange={(event) => pickFile(event.target.files)}
                      />
                    </label>
                  </Field>
                ) : (
                  <Field label="Your response" hint="Write the answer here. Word count is recorded on submission.">
                    <TextArea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={8}
                      placeholder="Answer in your own words, referencing the sources you used."
                    />
                  </Field>
                )}

                <Field label="Note to the faculty member" hint="Optional. Anything they should know about this submission.">
                  <TextInput
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Submitted a day early because of the field trip next week."
                  />
                </Field>

                <Checkbox
                  checked={declared}
                  onChange={setDeclared}
                  label="This is my own work"
                  hint="Submitting work that is not yours is academic misconduct."
                />

                {error ? (
                  <InlineNote tone="danger" title="Check the submission">
                    {error}
                  </InlineNote>
                ) : null}

                <Button
                  variant="primary"
                  icon={<Send className="size-4" />}
                  onClick={() => setConfirmSubmit(true)}
                  disabled={deadline.days < 0}
                >
                  {submission ? 'Resubmit' : 'Submit assignment'}
                </Button>
                {deadline.days < 0 ? (
                  <InlineNote tone="warn">
                    The deadline has passed. Submissions are closed here — contact {assignment.createdBy} about a late
                    submission.
                  </InlineNote>
                ) : null}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel strength="float" className="lg:sticky lg:top-24">
            <p className="caps">Deadline</p>
            <p className="mt-2 text-[1.125rem] text-fg">{formatDate(assignment.dueAt, 'medium')}</p>
            <p className="mt-1 text-xs text-fg-subtle">
              {formatTime(new Date(assignment.dueAt).toTimeString().slice(0, 5))} · {deadline.text}
            </p>
            <div className="mt-3">
              <Meter value={assignment.maxMarks} max={Math.max(assignment.maxMarks, 50)} tone="accent" />
            </div>
            <Divider />
            <dl>
              <KeyValue label="Course">{course?.title}</KeyValue>
              <KeyValue label="Faculty">{assignment.createdBy}</KeyValue>
              <KeyValue label="Marks">{assignment.maxMarks}</KeyValue>
              <KeyValue label="State">{assignment.state}</KeyValue>
            </dl>
            <Link
              to={`/academics/courses/${assignment.courseCode}`}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
            >
              <FileText className="size-3.5" aria-hidden="true" />
              All material for {assignment.courseCode}
            </Link>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={handleSubmit}
        title="Submit this assignment?"
        description={
          submission
            ? 'Your previous submission will be replaced by this one.'
            : 'Once submitted, your faculty member can see it. You can resubmit before the deadline.'
        }
        confirmLabel={submission ? 'Resubmit' : 'Submit'}
      />
    </div>
  );
}
