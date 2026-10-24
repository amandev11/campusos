import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Lock, Megaphone, ShieldAlert, Upload } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { COURSES, DOCUMENT_CATEGORIES, courseByCode } from '@/data/academics';
import { MAX_DOCUMENT_BYTES, keepSessionFile, validateDocument } from '@/lib/images';
import {
  Badge,
  Button,
  EmptyState,
  InlineNote,
  Panel,
  SectionHeader,
} from '@/components/ui/primitives';
import { Checkbox, Field, OptionCards, Select, TextArea, TextInput } from '@/components/ui/fields';
import { useToast } from '@/components/ui/Toast';
import { ModuleHero } from '@/features/shared';
import type { DocumentCategory, NoticeImportance } from '@/lib/types';

type Kind = 'notice' | 'assignment' | 'document';

const KIND_TITLES: Record<Kind, { title: string; description: string; icon: typeof Megaphone }> = {
  notice: {
    title: 'Publish an announcement',
    description:
      'Reach a course channel, your department, or the whole institution. Every notice carries your name and channel.',
    icon: Megaphone,
  },
  assignment: {
    title: 'Create an assignment',
    description: 'Set a brief, a due date and the marks available. Students see it immediately on their list.',
    icon: FileText,
  },
  document: {
    title: 'Add course material',
    description: 'Publish a PDF to the library with a real inline preview, tagged to a course and a category.',
    icon: Upload,
  },
};

export default function ManagePage() {
  const { kind: rawKind } = useParams<{ kind: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { profile, authorNotice, authorAssignment, authorDocument } = useApp();

  const kind = (['notice', 'assignment', 'document'].includes(rawKind ?? '') ? rawKind : 'notice') as Kind;
  const meta = KIND_TITLES[kind];

  const permitted =
    (kind === 'assignment' && profile.role === 'faculty') ||
    (kind === 'notice' && profile.role !== 'student') ||
    (kind === 'document' && profile.role !== 'student');

  /* notice state */
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [scope, setScope] = useState<'university' | 'department' | 'course' | 'community'>(
    profile.role === 'admin' ? 'university' : 'course',
  );
  const [courseCode, setCourseCode] = useState(COURSES[0]?.code ?? '');
  const [importance, setImportance] = useState<NoticeImportance>('normal');
  const [category, setCategory] = useState('Course update');

  /* assignment state */
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().slice(0, 10);
  });
  const [dueTime, setDueTime] = useState('23:59');
  const [marks, setMarks] = useState('20');

  /* document state */
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('study-notes');
  const [docCourse, setDocCourse] = useState<string>('none');
  const [restricted, setRestricted] = useState(false);
  const [file, setFile] = useState<{ name: string; sizeKb: number } | null>(null);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  function pickDocumentFile(files: FileList | null) {
    const picked = files?.[0];
    if (!picked) return;
    const check = validateDocument(picked);
    if (!check.ok) {
      setFileError(check.error);
      return;
    }
    setFileError(null);
    setFileObject(picked);
    setFile({ name: picked.name, sizeKb: Math.round(picked.size / 1024) });
    if (!docTitle) setDocTitle(picked.name.replace(/\.pdf$/i, ''));
  }

  function publishNotice() {
    const result = authorNotice({
      title: noticeTitle,
      body: noticeBody,
      scope,
      channel:
        scope === 'university'
          ? 'Institution'
          : scope === 'department'
            ? profile.department
            : scope === 'course'
              ? 'Course announcement'
              : 'Community',
      department: profile.department || 'Academic Affairs',
      courseCode: scope === 'course' ? courseCode : null,
      importance,
      category,
    });
    if (!result.ok) {
      setError(result.error ?? 'Could not publish.');
      return;
    }
    toast.success('Announcement published', 'Visible immediately in the notice centre.');
    navigate(`/academics/notices/${result.value!.id}`);
  }

  function createAssignment() {
    const dueAt = new Date(`${dueDate}T${dueTime}:00`);
    if (Number.isNaN(dueAt.getTime())) {
      setError('Choose a valid due date and time.');
      return;
    }
    const result = authorAssignment({
      courseCode,
      title: assignmentTitle,
      brief,
      dueAt: dueAt.toISOString(),
      maxMarks: Number(marks),
      attachmentId: null,
    });
    if (!result.ok) {
      setError(result.error ?? 'Could not create the assignment.');
      return;
    }
    toast.success('Assignment created', 'Students on that course can see it now.');
    navigate(`/academics/assignments/${result.value!.id}`);
  }

  function publishDocument() {
    if (!file || !fileObject) {
      setFileError('Choose a PDF to publish.');
      return;
    }
    const course = docCourse === 'none' ? null : docCourse;
    const courseTitle = course ? (courseByCode(course)?.title ?? course) : 'General academic material';
    const result = authorDocument({
      title: docTitle,
      courseCode: course,
      category: docCategory,
      department: course ? (courseByCode(course)?.department ?? profile.department) : profile.department || 'Academic Affairs',
      pages: Math.max(1, Math.round(file.sizeKb / 180)),
      sizeKb: file.sizeKb,
      tags: [docCategory.replace('-', ' '), course ?? 'general'].filter(Boolean),
      restricted,
      fileUrl: null,
      uploadedBy: profile.name,
      preview: [
        {
          heading: docTitle,
          subheading: `${docCategory.replace('-', ' ')} · ${courseTitle}`,
          blocks: [
            { kind: 'callout', text: `Uploaded by ${profile.name}. The original PDF is shown from this browser session only.` },
            {
              kind: 'para',
              text: 'This page is a generated cover for an uploaded document. The viewer displays the actual PDF you selected alongside this metadata.',
            },
            { kind: 'list', text: 'Course context|Scope and reading order|Assessment relevance|Contact for questions' },
          ],
        },
      ],
    });
    if (!result.ok || !result.value) {
      setError(result.error ?? 'Could not publish the document.');
      return;
    }
    keepSessionFile(result.value.id, fileObject);
    toast.success('Document published', 'Readable in this session. Connect storage to keep the file permanently.');
    navigate(`/academics/library/${result.value.id}`);
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

      <ModuleHero
        eyebrow={`Publishing · ${profile.role}`}
        title={meta.title}
        description={meta.description}
        meta={
          <>
            <Badge tone="accent">{profile.name}</Badge>
            <Badge tone="muted">{profile.department || 'Department not set'}</Badge>
          </>
        }
      />

      {!permitted ? (
        <EmptyState
          icon={<Lock className="size-5" aria-hidden="true" />}
          title="Your role cannot publish this"
          description={`Publishing ${kind === 'assignment' ? 'assignments' : kind === 'notice' ? 'announcements' : 'documents'} requires ${
            kind === 'assignment' ? 'a faculty account' : 'a faculty or administrator account'
          }. Authorisation is enforced by the store, not only by hiding this page.`}
          action={
            <Link
              to="/academics"
              className="inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
            >
              Back to the academic hub
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Panel>
            {kind === 'notice' ? (
              <div className="space-y-5">
                <Field label="Title" required hint="Say what changed and what the reader must do.">
                  <TextInput
                    value={noticeTitle}
                    onChange={(event) => setNoticeTitle(event.target.value)}
                    placeholder="CS301 lab viva moved to Thursday afternoon"
                  />
                </Field>
                <Field label="Body" required hint="Include the actionable detail: times, rooms and who to contact.">
                  <TextArea
                    value={noticeBody}
                    onChange={(event) => setNoticeBody(event.target.value)}
                    rows={7}
                    placeholder="Because of the departmental seminar on Wednesday, the lab viva moves to Thursday between 14:00 and 17:00 in Lab 3. Bring your signed lab file."
                  />
                </Field>
                <Field label="Channel" hint="Determines who sees it and how it is labelled.">
                  <OptionCards
                    name="Channel"
                    columns={2}
                    value={scope}
                    onChange={setScope}
                    options={[
                      ...(profile.role === 'admin'
                        ? [{ value: 'university' as const, label: 'Institution-wide', hint: 'Everyone' }]
                        : []),
                      { value: 'department' as const, label: 'Department', hint: profile.department || 'Your department' },
                      { value: 'course' as const, label: 'Course', hint: 'Students on one course' },
                      { value: 'community' as const, label: 'Community', hint: 'Societies and clubs' },
                    ]}
                  />
                </Field>
                {scope === 'course' ? (
                  <Field label="Course">
                    <Select value={courseCode} onChange={(event) => setCourseCode(event.target.value)}>
                      {COURSES.map((course) => (
                        <option key={course.code} value={course.code}>
                          {course.code} — {course.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Importance">
                    <Select value={importance} onChange={(event) => setImportance(event.target.value as NoticeImportance)}>
                      <option value="normal">General</option>
                      <option value="high">Important</option>
                      <option value="critical">Critical</option>
                    </Select>
                  </Field>
                  <Field label="Category">
                    <TextInput value={category} onChange={(event) => setCategory(event.target.value)} />
                  </Field>
                </div>
                <Button variant="primary" icon={<meta.icon className="size-4" />} onClick={publishNotice}>
                  Publish announcement
                </Button>
              </div>
            ) : null}

            {kind === 'assignment' ? (
              <div className="space-y-5">
                <Field label="Course">
                  <Select value={courseCode} onChange={(event) => setCourseCode(event.target.value)}>
                    {COURSES.map((course) => (
                      <option key={course.code} value={course.code}>
                        {course.code} — {course.title}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Title" required>
                  <TextInput
                    value={assignmentTitle}
                    onChange={(event) => setAssignmentTitle(event.target.value)}
                    placeholder="Lab 6 — Implement a multi-level feedback queue scheduler"
                  />
                </Field>
                <Field label="Brief" required hint="Include what to submit and how it will be marked.">
                  <TextArea
                    value={brief}
                    onChange={(event) => setBrief(event.target.value)}
                    rows={6}
                    placeholder="Extend the provided simulator with a three-level feedback queue. Submit source code, a short design note and the timing chart for the three supplied workloads."
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Due date" required>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      className="h-11 w-full rounded-xl border border-line bg-[var(--glass-input-bg)] px-3.5 text-sm text-fg"
                    />
                  </Field>
                  <Field label="Due time" required>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(event) => setDueTime(event.target.value)}
                      className="h-11 w-full rounded-xl border border-line bg-[var(--glass-input-bg)] px-3.5 text-sm text-fg"
                    />
                  </Field>
                  <Field label="Marks" required>
                    <TextInput type="number" min={1} value={marks} onChange={(event) => setMarks(event.target.value)} />
                  </Field>
                </div>
                <Button variant="primary" onClick={createAssignment}>
                  Create assignment
                </Button>
              </div>
            ) : null}

            {kind === 'document' ? (
              <div className="space-y-5">
                <Field label="Title" required>
                  <TextInput
                    value={docTitle}
                    onChange={(event) => setDocTitle(event.target.value)}
                    placeholder="CS304 — Lab 7 briefing and reference implementations"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Category">
                    <Select
                      value={docCategory}
                      onChange={(event) => setDocCategory(event.target.value as DocumentCategory)}
                    >
                      {DOCUMENT_CATEGORIES.map((entry) => (
                        <option key={entry.value} value={entry.value}>
                          {entry.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Course" hint="Leave general for institution-wide material.">
                    <Select value={docCourse} onChange={(event) => setDocCourse(event.target.value)}>
                      <option value="none">General academic material</option>
                      {COURSES.map((course) => (
                        <option key={course.code} value={course.code}>
                          {course.code} — {course.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field
                  label="PDF file"
                  required
                  hint={`PDF only, up to ${Math.round(MAX_DOCUMENT_BYTES / 1024 / 1024)} MB. Validated in the browser.`}
                  error={fileError}
                >
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line py-8 text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted">
                    <Upload className="size-5" aria-hidden="true" />
                    <span className="text-xs">{file ? file.name : 'Choose a PDF'}</span>
                    <span className="text-[0.6875rem]">
                      {file ? `${file.sizeKb} KB · preview available this session` : 'Nothing is uploaded to a server'}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={(event) => pickDocumentFile(event.target.files)}
                    />
                  </label>
                </Field>
                <Checkbox
                  checked={restricted}
                  onChange={setRestricted}
                  label="Restrict this document"
                  hint="Marks it as requiring authorisation. Real access control depends on the ERP integration."
                />
                <Button variant="primary" icon={<Upload className="size-4" />} onClick={publishDocument}>
                  Publish document
                </Button>
              </div>
            ) : null}

            {error ? (
              <InlineNote tone="danger" className="mt-5" title="Not published">
                {error}
              </InlineNote>
            ) : null}
          </Panel>

          <div className="space-y-4">
            <Panel strength="quiet">
              <SectionHeader eyebrow="Before you publish" title="What happens next" />
              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-fg-muted">
                <li className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  Your name and channel are attached to the item so readers can weigh its authority.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  Content is stored in this browser. Other accounts on this device will not see it.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  Uploaded PDFs are readable for this session only, because no storage service is configured.
                </li>
              </ul>
            </Panel>

            <Panel strength="quiet">
              <p className="flex items-start gap-2.5 text-xs leading-relaxed text-fg-muted">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
                <span>
                  Never publish student records, unpublished examination papers or anything you do not have the right to
                  distribute. Institutional authorisation is enforced by the backend, not by this screen.
                </span>
              </p>
            </Panel>

            <Panel strength="quiet">
              <p className="caps">Related</p>
              <ul className="mt-3 space-y-2 text-xs">
                <li>
                  <Link to="/academics/notices" className="text-accent hover:text-accent-hover">
                    Notice centre
                  </Link>
                </li>
                <li>
                  <Link to="/academics/assignments" className="text-accent hover:text-accent-hover">
                    Assignments
                  </Link>
                </li>
                <li>
                  <Link to="/academics/library" className="text-accent hover:text-accent-hover">
                    Document library
                  </Link>
                </li>
              </ul>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
