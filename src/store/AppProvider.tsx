import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { BOOKS } from '@/data/books';
import { PARKING_LOTS } from '@/data/parking';
import { makeId, makeReference } from '@/lib/ids';
import { readKey, writeKey } from '@/lib/storage';
import {
  allAssignments,
  allDocuments,
  allNotices,
  appReducer,
  createInitialState,
  findConflictingReservation,
  resolveBook,
  type ActivityEntry,
  type AppState,
} from './state';
import { useAuth } from './AuthProvider';
import type {
  ApplicationRecord,
  ApplicationStage,
  Assignment,
  Book,
  BookCondition,
  CampusDocument,
  DocumentCategory,
  Notice,
  Profile,
  ReportRecord,
  Reservation,
  SavedItem,
  SavedKind,
  Submission,
  TransactionType,
} from '@/lib/types';

/* ------------------------------------------------------------- command types */

export interface CommandResult<T = undefined> {
  ok: boolean;
  error?: string;
  value?: T;
}

export interface ListingDraft {
  title: string;
  author: string;
  subject: string;
  edition: string;
  isbn: string;
  publisher: string;
  condition: BookCondition;
  transaction: TransactionType;
  price: number;
  description: string;
  courseCodes: string[];
  location: string;
  fulfilment: ('pickup' | 'delivery')[];
  coverImage: string | null;
  pages: number;
  tags: string[];
}

export interface BookingDraft {
  lotId: string;
  zoneLabel: string;
  date: string;
  start: string;
  end: string;
  plate: string;
  purpose: string;
}

export interface SubmissionDraft {
  assignmentId: string;
  method: 'file' | 'text';
  fileName: string | null;
  note: string;
  wordCount: number;
}

export interface NoticeDraft {
  title: string;
  body: string;
  scope: Notice['scope'];
  channel: string;
  department: string;
  courseCode: string | null;
  importance: Notice['importance'];
  category: string;
}

export interface AssignmentDraft {
  courseCode: string;
  title: string;
  brief: string;
  dueAt: string;
  maxMarks: number;
  attachmentId: string | null;
}

export interface DocumentDraft {
  title: string;
  courseCode: string | null;
  category: DocumentCategory;
  department: string;
  pages: number;
  sizeKb: number;
  tags: string[];
  restricted: boolean;
  fileUrl: string | null;
  preview: CampusDocument['preview'];
  uploadedBy: string;
}

/* -------------------------------------------------------------------- context */

interface AppContextValue {
  state: AppState;
  profile: Profile;
  books: Book[];
  notices: Notice[];
  assignments: Assignment[];
  documents: CampusDocument[];
  unreadNotifications: number;
  unreadThreads: number;
  isSaved: (refId: string) => boolean;
  toggleSaved: (item: Omit<SavedItem, 'id' | 'savedAt'>) => void;
  removeSaved: (refId: string) => void;
  setApplication: (opportunityId: string, patch: Partial<ApplicationRecord>) => void;
  advanceApplication: (opportunityId: string, stage: ApplicationStage) => void;
  createListing: (draft: ListingDraft) => CommandResult<Book>;
  updateListing: (id: string, patch: Partial<Book>) => void;
  removeListing: (id: string) => void;
  reserve: (draft: BookingDraft) => CommandResult<Reservation>;
  cancelReservation: (id: string, reason: string) => CommandResult;
  submitAssignment: (draft: SubmissionDraft) => CommandResult;
  gradeSubmission: (assignmentId: string, marks: number, feedback: string) => CommandResult;
  toggleDocumentBookmark: (id: string) => void;
  markNoticeRead: (id: string) => void;
  markAllNoticesRead: () => void;
  authorNotice: (draft: NoticeDraft) => CommandResult<Notice>;
  authorAssignment: (draft: AssignmentDraft) => CommandResult<Assignment>;
  authorDocument: (draft: DocumentDraft) => CommandResult<CampusDocument>;
  removeDocument: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  addReport: (report: Omit<ReportRecord, 'id' | 'createdAt' | 'status'>) => void;
  sendMessage: (threadId: string, body: string) => void;
  markThreadRead: (id: string) => void;
  startThread: (input: {
    participantId: string;
    participantName: string;
    subject: string;
    context: string;
    body: string;
  }) => string;
  toggleSection: (id: string) => void;
  moveSection: (id: string, direction: -1 | 1) => void;
  recordSearch: (term: string) => void;
  clearRecentSearches: () => void;
  pushActivity: (entry: Omit<ActivityEntry, 'id' | 'at'>) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_VERSION = 1;

function stateKey(userId: string): string {
  return `state.v${STORAGE_VERSION}.${userId}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfile } = useAuth();
  if (!profile) throw new Error('AppProvider requires an authenticated profile');

  const [state, dispatch] = useReducer(appReducer, profile, (initial) => {
    const stored = readKey<AppState | null>(stateKey(initial.id), null);
    if (!stored) return createInitialState(initial);
    // Re-derive the profile from the auth record so edits always win.
    return { ...stored, profile: initial };
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  /* Persistence: debounced so typing-heavy flows do not thrash the store. */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeKey(stateKey(state.profile.id), state);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [state]);

  /* Keep the auth record and the store profile in step. */
  useEffect(() => {
    const { id: _id, ...rest } = state.profile;
    const baseline = profile as unknown as Record<string, unknown>;
    const diff = Object.entries(rest).some(([key, value]) => baseline[key] !== value);
    if (diff) updateProfile(state.profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.profile]);

  const books = useMemo(() => [...state.listings, ...BOOKS], [state.listings]);
  const notices = useMemo(() => allNotices(state), [state]);
  const assignments = useMemo(() => allAssignments(state), [state]);
  const documents = useMemo(() => allDocuments(state), [state]);

  const savedRefs = useMemo(() => new Set(state.saved.map((item) => item.refId)), [state.saved]);

  const isSaved = useCallback((refId: string) => savedRefs.has(refId), [savedRefs]);

  const toggleSaved = useCallback<AppContextValue['toggleSaved']>((item) => {
    dispatch({
      type: 'saved/toggle',
      item: { ...item, id: makeId('sv'), savedAt: new Date().toISOString() },
    });
  }, []);

  const createListing = useCallback<AppContextValue['createListing']>(
    (draft) => {
      if (draft.title.trim().length < 3) return { ok: false, error: 'Give the listing a title.' };
      if (draft.author.trim().length < 2) return { ok: false, error: 'Add the author or compiler.' };
      if (draft.description.trim().length < 20) {
        return { ok: false, error: 'Write at least a sentence describing the condition.' };
      }
      if (draft.transaction === 'sale' && draft.price <= 0) {
        return { ok: false, error: 'Set a price above zero, or choose a different transaction type.' };
      }
      const current = stateRef.current.profile;
      const listing: Book = {
        id: makeId('bk'),
        title: draft.title.trim(),
        author: draft.author.trim(),
        isbn: draft.isbn.trim() || 'Not provided',
        edition: draft.edition.trim() || 'Edition not stated',
        publisher: draft.publisher.trim() || 'Not stated',
        subject: draft.subject,
        courseCodes: draft.courseCodes,
        language: 'English',
        pages: draft.pages || 0,
        condition: draft.condition,
        transaction: draft.transaction,
        price: { amount: draft.transaction === 'sale' ? draft.price : 0, currency: 'INR' },
        coverImage: draft.coverImage ?? '',
        description: draft.description.trim(),
        seller: {
          id: current.id,
          name: current.name,
          department: current.programme || current.department,
          campus: 'Your location',
          joinedAt: current.joinedAt,
          listingsCount: stateRef.current.listings.length + 1,
          dealsCompleted: 0,
        },
        location: draft.location.trim() || 'Pickup point not stated',
        fulfilment: draft.fulfilment.length > 0 ? draft.fulfilment : ['pickup'],
        status: 'under-review',
        createdAt: new Date().toISOString(),
        origin: 'user',
        tags: draft.tags,
      };
      dispatch({ type: 'listing/add', listing });
      return { ok: true, value: listing };
    },
    [],
  );

  const reserve = useCallback<AppContextValue['reserve']>((draft) => {
    const lot = PARKING_LOTS.find((entry) => entry.id === draft.lotId);
    if (!lot) return { ok: false, error: 'That parking area is unavailable.' };

    const current = stateRef.current.profile;
    if (!lot.eligibility.includes(current.parkingEligibility)) {
      return {
        ok: false,
        error: `Your ${current.parkingEligibility} permit does not grant access to ${lot.name}.`,
      };
    }
    if (!draft.plate.trim()) return { ok: false, error: 'Add the vehicle registration to reserve a bay.' };
    if (draft.start >= draft.end) return { ok: false, error: 'The end time must be after the start time.' };

    const now = new Date();
    const slotStart = new Date(`${draft.date}T${draft.start}:00`);
    if (Number.isNaN(slotStart.getTime())) return { ok: false, error: 'Choose a valid date and time.' };
    if (slotStart.getTime() < now.getTime()) return { ok: false, error: 'Reservations cannot start in the past.' };

    const horizon = new Date(now.getTime() + 14 * 86400000);
    if (slotStart.getTime() > horizon.getTime()) {
      return { ok: false, error: 'Reservations open 14 days ahead. Pick a nearer date.' };
    }

    const [startH, startM] = draft.start.split(':').map(Number);
    const [endH, endM] = draft.end.split(':').map(Number);
    const minutes = (endH! * 60 + endM!) - (startH! * 60 + startM!);
    if (minutes < 30) return { ok: false, error: 'Book at least 30 minutes.' };
    if (minutes > 12 * 60) return { ok: false, error: 'A single reservation cannot exceed 12 hours.' };

    /* Availability: real deployments must validate this on the server. */
    if (lot.occupancy && lot.occupancy.available <= 0) {
      return { ok: false, error: `${lot.name} has no free bays recorded right now.` };
    }

    const conflict = findConflictingReservation(stateRef.current.reservations, {
      lotId: draft.lotId,
      date: draft.date,
      start: draft.start,
      end: draft.end,
    });
    if (conflict) {
      return {
        ok: false,
        error: `You already hold ${conflict.zoneLabel} at ${conflict.start}–${conflict.end} that day. Choose another time or area.`,
      };
    }

    const reservation: Reservation = {
      id: makeId('res'),
      lotId: lot.id,
      lotName: lot.name,
      lotCode: lot.code,
      zoneLabel: draft.zoneLabel,
      date: draft.date,
      start: draft.start,
      end: draft.end,
      status: 'confirmed',
      plate: draft.plate.trim().toUpperCase(),
      reference: makeReference(lot.code),
      createdAt: new Date().toISOString(),
      cancelledAt: null,
      cancelReason: null,
      origin: 'user',
    };
    dispatch({ type: 'reservation/add', reservation });
    return { ok: true, value: reservation };
  }, []);

  const cancelReservation = useCallback<AppContextValue['cancelReservation']>((id, reason) => {
    const reservation = stateRef.current.reservations.find((entry) => entry.id === id);
    if (!reservation) return { ok: false, error: 'That reservation no longer exists.' };
    if (reservation.status !== 'confirmed') {
      return { ok: false, error: 'Only a confirmed reservation can be cancelled.' };
    }
    dispatch({ type: 'reservation/cancel', id, reason: reason.trim() || 'Cancelled by the account holder' });
    return { ok: true };
  }, []);

  const submitAssignment = useCallback<AppContextValue['submitAssignment']>((draft) => {
    const assignment = stateRef.current.authoredAssignments
      .concat(assignments)
      .find((entry) => entry.id === draft.assignmentId);
    if (!assignment) return { ok: false, error: 'That assignment is no longer available.' };
    if (draft.method === 'file' && !draft.fileName) {
      return { ok: false, error: 'Choose a file or switch to a written response.' };
    }
    if (draft.method === 'text' && draft.note.trim().length < 10) {
      return { ok: false, error: 'Write at least a couple of sentences before submitting.' };
    }
    const submission: Submission = {
      assignmentId: draft.assignmentId,
      submittedAt: new Date().toISOString(),
      method: draft.method,
      fileName: draft.fileName,
      note: draft.note.trim(),
      wordCount: draft.method === 'text' ? draft.note.trim().split(/\s+/).length : draft.wordCount,
      marks: null,
      feedback: null,
      state: 'submitted',
    };
    dispatch({ type: 'submission/save', submission });
    return { ok: true };
  }, [assignments]);

  const gradeSubmission = useCallback<AppContextValue['gradeSubmission']>(
    (assignmentId, marks, feedback) => {
      const assignment = assignments.find((entry) => entry.id === assignmentId);
      const submission = stateRef.current.submissions[assignmentId];
      if (!assignment || !submission) return { ok: false, error: 'No submission to grade yet.' };
      if (marks < 0 || marks > assignment.maxMarks) {
        return { ok: false, error: `Marks must be between 0 and ${assignment.maxMarks}.` };
      }
      dispatch({ type: 'submission/grade', assignmentId, marks, feedback: feedback.trim() });
      return { ok: true };
    },
    [assignments],
  );

  const authorNotice = useCallback<AppContextValue['authorNotice']>((draft) => {
    if (draft.title.trim().length < 6) return { ok: false, error: 'Give the announcement a clear title.' };
    if (draft.body.trim().length < 30) return { ok: false, error: 'Add a body of at least a few sentences.' };
    const notice: Notice = {
      ...draft,
      id: makeId('nt'),
      title: draft.title.trim(),
      body: draft.body.trim(),
      semester: null,
      publishedAt: new Date().toISOString(),
      author: stateRef.current.profile.name,
      pinned: false,
      attachmentId: null,
      origin: 'institution',
    };
    dispatch({ type: 'notice/author', notice });
    return { ok: true, value: notice };
  }, []);

  const authorAssignment = useCallback<AppContextValue['authorAssignment']>((draft) => {
    if (draft.title.trim().length < 5) return { ok: false, error: 'Give the assignment a title.' };
    if (draft.brief.trim().length < 20) return { ok: false, error: 'Add a brief of at least a sentence.' };
    if (!draft.dueAt) return { ok: false, error: 'Set a due date.' };
    if (draft.maxMarks <= 0) return { ok: false, error: 'Maximum marks must be above zero.' };
    const assignment: Assignment = {
      ...draft,
      id: makeId('as'),
      title: draft.title.trim(),
      brief: draft.brief.trim(),
      dueAt: new Date(draft.dueAt).toISOString(),
      state: 'open',
      createdBy: stateRef.current.profile.name,
      origin: 'institution',
    };
    dispatch({ type: 'assignment/author', assignment });
    return { ok: true, value: assignment };
  }, []);

  const authorDocument = useCallback<AppContextValue['authorDocument']>((draft) => {
    if (draft.title.trim().length < 4) return { ok: false, error: 'Give the document a title.' };
    const document: CampusDocument = {
      ...draft,
      id: makeId('doc'),
      title: draft.title.trim(),
      uploadedAt: new Date().toISOString(),
      downloads: 0,
      origin: 'institution',
    };
    dispatch({ type: 'document/author', document });
    return { ok: true, value: document };
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      profile: state.profile,
      books,
      notices,
      assignments,
      documents,
      unreadNotifications: state.notifications.filter((entry) => !entry.read).length,
      unreadThreads: state.threads.reduce((total, thread) => total + thread.unread, 0),
      isSaved,
      toggleSaved,
      removeSaved: (refId) => dispatch({ type: 'saved/remove', refId }),
      setApplication: (opportunityId, patch) => {
        const existing = stateRef.current.applications[opportunityId];
        dispatch({
          type: 'application/set',
          record: {
            opportunityId,
            stage: patch.stage ?? existing?.stage ?? 'saved',
            updatedAt: new Date().toISOString(),
            note: patch.note ?? existing?.note ?? '',
            reminderAt: patch.reminderAt ?? existing?.reminderAt ?? null,
          },
        });
      },
      advanceApplication: (opportunityId, stage) => {
        const existing = stateRef.current.applications[opportunityId];
        dispatch({
          type: 'application/set',
          record: {
            opportunityId,
            stage,
            updatedAt: new Date().toISOString(),
            note: existing?.note ?? '',
            reminderAt: existing?.reminderAt ?? null,
          },
        });
      },
      createListing,
      updateListing: (id, patch) => dispatch({ type: 'listing/update', id, patch }),
      removeListing: (id) => dispatch({ type: 'listing/remove', id }),
      reserve,
      cancelReservation,
      submitAssignment,
      gradeSubmission,
      toggleDocumentBookmark: (id) => dispatch({ type: 'document/toggle-bookmark', id }),
      markNoticeRead: (id) => dispatch({ type: 'notice/read', id }),
      markAllNoticesRead: () => dispatch({ type: 'notice/read-all', ids: notices.map((entry) => entry.id) }),
      authorNotice,
      authorAssignment,
      authorDocument,
      removeDocument: (id) => dispatch({ type: 'document/remove', id }),
      markNotificationRead: (id) => dispatch({ type: 'notification/read', id }),
      markAllNotificationsRead: () => dispatch({ type: 'notification/read-all' }),
      removeNotification: (id) => dispatch({ type: 'notification/remove', id }),
      addReport: (report) =>
        dispatch({
          type: 'report/add',
          report: { ...report, id: makeId('rep'), createdAt: new Date().toISOString(), status: 'received' },
        }),
      sendMessage: (threadId, body) =>
        dispatch({
          type: 'thread/send',
          threadId,
          body: body.trim(),
          authorId: stateRef.current.profile.id,
          author: stateRef.current.profile,
        }),
      markThreadRead: (id) => dispatch({ type: 'thread/read', id }),
      startThread: ({ participantId, participantName, subject, context, body }) => {
        const current = stateRef.current.profile;
        const existing = stateRef.current.threads.find(
          (thread) =>
            thread.subject === subject && thread.participants.some((entry) => entry.id === participantId),
        );
        if (existing) {
          dispatch({
            type: 'thread/send',
            threadId: existing.id,
            body: body.trim(),
            authorId: current.id,
            author: current,
          });
          return existing.id;
        }
        const threadId = makeId('th');
        dispatch({
          type: 'thread/start',
          thread: {
            id: threadId,
            subject,
            context,
            unread: 0,
            participants: [
              { id: current.id, name: current.name, role: current.role, avatarSeed: current.avatarSeed },
              { id: participantId, name: participantName, role: 'student', avatarSeed: participantId },
            ],
            messages: [
              {
                id: makeId('msg'),
                threadId,
                authorId: current.id,
                body: body.trim(),
                sentAt: new Date().toISOString(),
              },
            ],
          },
        });
        return threadId;
      },
      toggleSection: (id) => dispatch({ type: 'prefs/toggle', id }),
      moveSection: (id, direction) => dispatch({ type: 'prefs/move', id, direction }),
      recordSearch: (term) => dispatch({ type: 'search/record', term }),
      clearRecentSearches: () => dispatch({ type: 'search/clear' }),
      pushActivity: (entry) => dispatch({ type: 'activity/push', entry }),
      resetState: () => dispatch({ type: 'state/replace', state: createInitialState(stateRef.current.profile) }),
    }),
    [
      state,
      books,
      notices,
      assignments,
      documents,
      isSaved,
      toggleSaved,
      createListing,
      reserve,
      cancelReservation,
      submitAssignment,
      gradeSubmission,
      authorNotice,
      authorAssignment,
      authorDocument,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

export function useBook(id: string | undefined): Book | undefined {
  const { state } = useApp();
  if (!id) return undefined;
  return resolveBook(state, id);
}

export function useSavedKind(kind: SavedKind) {
  const { state } = useApp();
  return useMemo(() => state.saved.filter((item) => item.kind === kind), [state.saved, kind]);
}
