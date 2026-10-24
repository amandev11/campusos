import {
  ASSIGNMENTS,
  DOCUMENTS,
  NOTICES,
  SEEDED_SUBMISSIONS,
} from '@/data/academics';
import { DASHBOARD_SECTION_SEEDS, MESSAGE_THREADS, NOTIFICATIONS } from '@/data/community';
import { BOOKS } from '@/data/books';
import { PARKING_LOTS, SEEDED_RESERVATIONS } from '@/data/parking';
import { makeId } from '@/lib/ids';
import type {
  AppNotification,
  ApplicationRecord,
  Assignment,
  Book,
  CampusDocument,
  DashboardSectionPref,
  MessageThread,
  Notice,
  Profile,
  ReportRecord,
  Reservation,
  SavedItem,
  Submission,
} from '@/lib/types';

/* ------------------------------------------------------------------- shape */

export interface ActivityEntry {
  id: string;
  label: string;
  detail: string;
  at: string;
  href: string | null;
  tone: 'neutral' | 'positive' | 'attention';
}

export interface AppState {
  profile: Profile;
  listings: Book[];
  saved: SavedItem[];
  applications: Record<string, ApplicationRecord>;
  reservations: Reservation[];
  submissions: Record<string, Submission>;
  bookmarkedDocuments: string[];
  readNotices: string[];
  notifications: AppNotification[];
  reports: ReportRecord[];
  threads: MessageThread[];
  prefs: DashboardSectionPref[];
  recentSearches: string[];
  authoredNotices: Notice[];
  authoredAssignments: Assignment[];
  authoredDocuments: CampusDocument[];
  activity: ActivityEntry[];
}

/* ------------------------------------------------------------------- seeds */

function seededReservations(profile: Profile): Reservation[] {
  if (profile.role !== 'student') return [];
  return SEEDED_RESERVATIONS.map((reservation) => ({ ...reservation, plate: profile.vehicleLabel || reservation.plate }));
}

function seededNotifications(profile: Profile): AppNotification[] {
  if (profile.role === 'student') return NOTIFICATIONS.map((entry) => ({ ...entry }));
  const allowed = profile.role === 'faculty' ? ['academics', 'opportunities'] : ['academics', 'system', 'parking'];
  return NOTIFICATIONS.filter((entry) => allowed.includes(entry.module)).map((entry) => ({
    ...entry,
    read: true,
    // The signed-in name should never appear in its own feed for another role.
    body: entry.body.replace(/your|Your/g, (match) => match.toLowerCase()),
  }));
}

function seededApplications(profile: Profile): Record<string, ApplicationRecord> {
  if (profile.role !== 'student') return {};
  const now = Date.now();
  return {
    'op-nimbus-intern': {
      opportunityId: 'op-nimbus-intern',
      stage: 'interviewing',
      updatedAt: new Date(now - 86400000 * 2).toISOString(),
      note: 'Technical round scheduled. Re-read my algorithms project write-up.',
      reminderAt: null,
    },
    'op-data-analyst': {
      opportunityId: 'op-data-analyst',
      stage: 'applied',
      updatedAt: new Date(now - 86400000 * 5).toISOString(),
      note: 'Applied with the public-health dashboard as the portfolio piece.',
      reminderAt: null,
    },
    'op-remote-design': {
      opportunityId: 'op-remote-design',
      stage: 'preparing',
      updatedAt: new Date(now - 86400000).toISOString(),
      note: 'Portfolio needs a second case study before I apply.',
      reminderAt: new Date(now + 86400000 * 3).toISOString(),
    },
    'op-alpine-season': {
      opportunityId: 'op-alpine-season',
      stage: 'saved',
      updatedAt: new Date(now - 86400000 * 1).toISOString(),
      note: '',
      reminderAt: null,
    },
  };
}

function seededSaved(profile: Profile): SavedItem[] {
  if (profile.role !== 'student') return [];
  const book = BOOKS.find((entry) => entry.id === 'bk-clean-code');
  const notice = NOTICES.find((entry) => entry.id === 'nt-exam-datesheet');
  return [
    book
      ? {
          id: 'sv-seed-1',
          kind: 'book',
          refId: book.id,
          title: book.title,
          subtitle: `${book.author} · ${book.location}`,
          href: `/books/${book.id}`,
          savedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        }
      : null,
    notice
      ? {
          id: 'sv-seed-2',
          kind: 'notice',
          refId: notice.id,
          title: notice.title,
          subtitle: notice.channel,
          href: `/academics/notices/${notice.id}`,
          savedAt: new Date(Date.now() - 86400000).toISOString(),
        }
      : null,
    {
      id: 'sv-seed-3',
      kind: 'parking',
      refId: 'lot-faculty-court',
      title: 'Faculty Court',
      subtitle: 'FC-2 · 84 spaces',
      href: '/parking/lot-faculty-court',
      savedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    },
  ].filter(Boolean) as SavedItem[];
}

function seededSubmissions(profile: Profile): Record<string, Submission> {
  if (profile.role !== 'student') return {};
  const records: Record<string, Submission> = {};
  for (const seed of SEEDED_SUBMISSIONS) {
    const assignment = ASSIGNMENTS.find((entry) => entry.id === seed.assignmentId);
    records[seed.assignmentId] = {
      assignmentId: seed.assignmentId,
      submittedAt: seed.submittedAt,
      method: 'file',
      fileName: `${assignment?.courseCode.toLowerCase() ?? 'submission'}-submission.pdf`,
      note: 'Submitted through CampusOS demonstration mode.',
      wordCount: 1840,
      marks: seed.marks,
      feedback: seed.feedback,
      state: seed.marks == null ? 'submitted' : 'graded',
    };
  }
  return records;
}

function seededThreads(profile: Profile): MessageThread[] {
  if (profile.role === 'student') return MESSAGE_THREADS.map((thread) => ({ ...thread }));
  const ids = profile.role === 'faculty' ? ['th-priya'] : ['th-estate'];
  return MESSAGE_THREADS.filter((thread) => ids.includes(thread.id)).map((thread) => ({
    ...thread,
    unread: 0,
  }));
}

function SEEDED_ACTIVITY(): ActivityEntry[] {
  const now = Date.now();
  return [
    {
      id: 'act-1',
      label: 'Application advanced',
      detail: 'Nimbus Systems — interview stage',
      at: new Date(now - 7200000).toISOString(),
      href: '/opportunities/tracker',
      tone: 'positive',
    },
    {
      id: 'act-2',
      label: 'Document opened',
      detail: 'CS301 lecture notes, weeks 1 to 9',
      at: new Date(now - 3600000 * 6).toISOString(),
      href: '/academics/library/doc-dsa-notes',
      tone: 'neutral',
    },
    {
      id: 'act-3',
      label: 'Deadline approaching',
      detail: 'CS304 Lab 6 falls due tomorrow',
      at: new Date(now - 3600000 * 9).toISOString(),
      href: '/academics/assignments/as-os-scheduler',
      tone: 'attention',
    },
  ];
}

export function createInitialState(profile: Profile): AppState {
  const fresh = !profile.onboarded;
  return {
    profile,
    listings: [],
    saved: fresh ? [] : seededSaved(profile),
    applications: fresh ? {} : seededApplications(profile),
    reservations: fresh ? [] : seededReservations(profile),
    submissions: fresh ? {} : seededSubmissions(profile),
    bookmarkedDocuments: fresh ? [] : ['doc-dsa-notes', 'doc-dbms-project'],
    readNotices: fresh ? [] : ['nt-library-hours', 'nt-hackathon'],
    notifications: fresh ? [] : seededNotifications(profile),
    reports: [],
    threads: fresh ? [] : seededThreads(profile),
    prefs: DASHBOARD_SECTION_SEEDS.map((section) => ({ ...section, visible: true })),
    recentSearches: fresh ? [] : ['algorithms', 'teaching abroad', 'North Deck', 'CS304 notes'],
    authoredNotices: [],
    authoredAssignments: [],
    authoredDocuments: [],
    activity: fresh ? [] : SEEDED_ACTIVITY(),
  };
}

/* ----------------------------------------------------------------- actions */

export type AppAction =
  | { type: 'profile/update'; patch: Partial<Profile> }
  | { type: 'listing/add'; listing: Book }
  | { type: 'listing/update'; id: string; patch: Partial<Book> }
  | { type: 'listing/remove'; id: string }
  | { type: 'saved/toggle'; item: SavedItem }
  | { type: 'saved/remove'; refId: string }
  | { type: 'application/set'; record: ApplicationRecord }
  | { type: 'reservation/add'; reservation: Reservation }
  | { type: 'reservation/cancel'; id: string; reason: string }
  | { type: 'submission/save'; submission: Submission }
  | { type: 'submission/grade'; assignmentId: string; marks: number; feedback: string }
  | { type: 'document/toggle-bookmark'; id: string }
  | { type: 'notice/read'; id: string }
  | { type: 'notice/read-all'; ids: string[] }
  | { type: 'notice/author'; notice: Notice }
  | { type: 'assignment/author'; assignment: Assignment }
  | { type: 'document/author'; document: CampusDocument }
  | { type: 'document/remove'; id: string }
  | { type: 'notification/read'; id: string }
  | { type: 'notification/read-all' }
  | { type: 'notification/remove'; id: string }
  | { type: 'report/add'; report: ReportRecord }
  | { type: 'thread/read'; id: string }
  | { type: 'thread/start'; thread: MessageThread }
  | { type: 'thread/send'; threadId: string; body: string; authorId: string; author: Profile }
  | { type: 'prefs/toggle'; id: string }
  | { type: 'prefs/move'; id: string; direction: -1 | 1 }
  | { type: 'search/record'; term: string }
  | { type: 'search/clear' }
  | { type: 'activity/push'; entry: Omit<ActivityEntry, 'id' | 'at'> }
  | { type: 'state/replace'; state: AppState };

function withActivity(state: AppState, entry: Omit<ActivityEntry, 'id' | 'at'>): AppState {
  const next: ActivityEntry = { ...entry, id: makeId('act'), at: new Date().toISOString() };
  return { ...state, activity: [next, ...state.activity].slice(0, 30) };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'state/replace':
      return action.state;

    case 'profile/update':
      return { ...state, profile: { ...state.profile, ...action.patch } };

    case 'listing/add':
      return withActivity({ ...state, listings: [action.listing, ...state.listings] }, {
        label: 'Listing created',
        detail: action.listing.title,
        href: `/books/${action.listing.id}`,
        tone: 'positive',
      });

    case 'listing/update':
      return {
        ...state,
        listings: state.listings.map((listing) =>
          listing.id === action.id ? { ...listing, ...action.patch } : listing,
        ),
      };

    case 'listing/remove':
      return {
        ...state,
        listings: state.listings.filter((listing) => listing.id !== action.id),
        saved: state.saved.filter((saved) => saved.refId !== action.id),
      };

    case 'saved/toggle': {
      const exists = state.saved.some((saved) => saved.refId === action.item.refId);
      if (exists) {
        return { ...state, saved: state.saved.filter((saved) => saved.refId !== action.item.refId) };
      }
      return withActivity({ ...state, saved: [action.item, ...state.saved] }, {
        label: 'Saved',
        detail: action.item.title,
        href: action.item.href,
        tone: 'neutral',
      });
    }

    case 'saved/remove':
      return { ...state, saved: state.saved.filter((saved) => saved.refId !== action.refId) };

    case 'application/set':
      return withActivity(
        { ...state, applications: { ...state.applications, [action.record.opportunityId]: action.record } },
        {
          label: `Application ${action.record.stage}`,
          detail: action.record.note || 'Application tracker updated',
          href: '/opportunities/tracker',
          tone: action.record.stage === 'completed' ? 'positive' : 'neutral',
        },
      );

    case 'reservation/add':
      return withActivity(
        { ...state, reservations: [action.reservation, ...state.reservations] },
        {
          label: 'Parking reserved',
          detail: `${action.reservation.lotName} · ${action.reservation.date} ${action.reservation.start}`,
          href: '/parking/bookings',
          tone: 'positive',
        },
      );

    case 'reservation/cancel':
      return withActivity(
        {
          ...state,
          reservations: state.reservations.map((reservation) =>
            reservation.id === action.id
              ? {
                  ...reservation,
                  status: 'cancelled',
                  cancelledAt: new Date().toISOString(),
                  cancelReason: action.reason,
                }
              : reservation,
          ),
        },
        { label: 'Reservation cancelled', detail: action.reason, href: '/parking/bookings', tone: 'attention' },
      );

    case 'submission/save':
      return withActivity(
        {
          ...state,
          submissions: { ...state.submissions, [action.submission.assignmentId]: action.submission },
        },
        {
          label: 'Assignment submitted',
          detail: action.submission.fileName ?? 'Written response submitted',
          href: `/academics/assignments/${action.submission.assignmentId}`,
          tone: 'positive',
        },
      );

    case 'submission/grade':
      return {
        ...state,
        submissions: {
          ...state.submissions,
          [action.assignmentId]: {
            ...(state.submissions[action.assignmentId] as Submission),
            marks: action.marks,
            feedback: action.feedback,
            state: 'graded',
          },
        },
      };

    case 'document/toggle-bookmark': {
      const has = state.bookmarkedDocuments.includes(action.id);
      return {
        ...state,
        bookmarkedDocuments: has
          ? state.bookmarkedDocuments.filter((id) => id !== action.id)
          : [action.id, ...state.bookmarkedDocuments],
      };
    }

    case 'notice/read':
      return state.readNotices.includes(action.id)
        ? state
        : { ...state, readNotices: [...state.readNotices, action.id] };

    case 'notice/read-all':
      return { ...state, readNotices: Array.from(new Set([...state.readNotices, ...action.ids])) };

    case 'notice/author':
      return withActivity({ ...state, authoredNotices: [action.notice, ...state.authoredNotices] }, {
        label: 'Announcement published',
        detail: action.notice.title,
        href: `/academics/notices/${action.notice.id}`,
        tone: 'positive',
      });

    case 'assignment/author':
      return withActivity({ ...state, authoredAssignments: [action.assignment, ...state.authoredAssignments] }, {
        label: 'Assignment created',
        detail: action.assignment.title,
        href: `/academics/assignments/${action.assignment.id}`,
        tone: 'positive',
      });

    case 'document/author':
      return withActivity({ ...state, authoredDocuments: [action.document, ...state.authoredDocuments] }, {
        label: 'Document added',
        detail: action.document.title,
        href: `/academics/library/${action.document.id}`,
        tone: 'positive',
      });

    case 'document/remove':
      return { ...state, authoredDocuments: state.authoredDocuments.filter((doc) => doc.id !== action.id) };

    case 'notification/read':
      return {
        ...state,
        notifications: state.notifications.map((entry) =>
          entry.id === action.id ? { ...entry, read: true } : entry,
        ),
      };

    case 'notification/read-all':
      return { ...state, notifications: state.notifications.map((entry) => ({ ...entry, read: true })) };

    case 'notification/remove':
      return { ...state, notifications: state.notifications.filter((entry) => entry.id !== action.id) };

    case 'report/add':
      return withActivity({ ...state, reports: [action.report, ...state.reports] }, {
        label: 'Report submitted',
        detail: `${action.report.refLabel} — ${action.report.reason}`,
        href: null,
        tone: 'attention',
      });

    case 'thread/read':
      return {
        ...state,
        threads: state.threads.map((thread) => (thread.id === action.id ? { ...thread, unread: 0 } : thread)),
      };

    case 'thread/start':
      return {
        ...state,
        threads: [action.thread, ...state.threads.filter((thread) => thread.id !== action.thread.id)],
      };

    case 'thread/send':
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === action.threadId
            ? {
                ...thread,
                unread: 0,
                messages: [
                  ...thread.messages,
                  {
                    id: makeId('msg'),
                    threadId: action.threadId,
                    authorId: action.authorId,
                    body: action.body,
                    sentAt: new Date().toISOString(),
                  },
                ],
              }
            : thread,
        ),
      };

    case 'prefs/toggle':
      return {
        ...state,
        prefs: state.prefs.map((section) =>
          section.id === action.id ? { ...section, visible: !section.visible } : section,
        ),
      };

    case 'prefs/move': {
      const index = state.prefs.findIndex((section) => section.id === action.id);
      const target = index + action.direction;
      if (index === -1 || target < 0 || target >= state.prefs.length) return state;
      const next = [...state.prefs];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved!);
      return { ...state, prefs: next };
    }

    case 'search/record': {
      const term = action.term.trim();
      if (term.length < 2) return state;
      const without = state.recentSearches.filter((entry) => entry.toLowerCase() !== term.toLowerCase());
      return { ...state, recentSearches: [term, ...without].slice(0, 6) };
    }

    case 'search/clear':
      return { ...state, recentSearches: [] };

    case 'activity/push':
      return withActivity(state, action.entry);

    default:
      return state;
  }
}

/* ------------------------------------------------------------- derivations */

export function resolveBook(state: AppState, id: string): Book | undefined {
  return state.listings.find((listing) => listing.id === id) ?? BOOKS.find((book) => book.id === id);
}

export function allNotices(state: AppState): Notice[] {
  return [...state.authoredNotices, ...NOTICES];
}

export function allAssignments(state: AppState): Assignment[] {
  return [...state.authoredAssignments, ...ASSIGNMENTS];
}

export function allDocuments(state: AppState): CampusDocument[] {
  return [...state.authoredDocuments, ...DOCUMENTS];
}

export interface ReservationWindow {
  lotId: string;
  date: string;
  start: string;
  end: string;
}

/** Overlap check used by the booking flow before a reservation is committed. */
export function findConflictingReservation(
  reservations: Reservation[],
  window: ReservationWindow,
): Reservation | undefined {
  return reservations.find(
    (reservation) =>
      reservation.status === 'confirmed' &&
      reservation.lotId === window.lotId &&
      reservation.date === window.date &&
      window.start < reservation.end &&
      reservation.start < window.end,
  );
}

export function lotById(id: string) {
  return PARKING_LOTS.find((lot) => lot.id === id);
}
