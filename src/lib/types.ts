/**
 * CampusOS domain model.
 *
 * Everything in this file is transport-shape only: the UI, the demo store and
 * the future server-backed data layer all speak these types. `demo` marks
 * records that ship with the product as sample content rather than verified
 * institutional or third-party data.
 */

export type Role = 'student' | 'faculty' | 'admin';

export type ThemeName = 'dark' | 'light';

export type DataOrigin = 'demo' | 'user' | 'institution' | 'partner';

/* ------------------------------------------------------------------ identity */

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarSeed: string;
  university: string;
  programme: string;
  department: string;
  semester: number;
  interests: string[];
  parkingEligibility: ParkingEligibility;
  vehicleLabel: string;
  bio: string;
  joinedAt: string;
  studentId: string;
  onboarded: boolean;
}

export interface Account extends Profile {
  /** Demo-only credential digest. Real deployments authenticate on the server. */
  passwordDigest: string;
}

export interface Session {
  userId: string;
  startedAt: string;
}

/* --------------------------------------------------------------- shared atoms */

export type TransactionType = 'sale' | 'borrow' | 'exchange' | 'free';

export type BookCondition = 'new' | 'like-new' | 'good' | 'fair';

export type ListingStatus = 'active' | 'reserved' | 'sold' | 'under-review' | 'removed';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'THB' | 'AUD';

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface SellerRef {
  id: string;
  name: string;
  department: string;
  campus: string;
  joinedAt: string;
  /** Seller-supplied stats are never presented as verified performance. */
  listingsCount: number;
  dealsCompleted: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  edition: string;
  publisher: string;
  subject: string;
  courseCodes: string[];
  language: string;
  pages: number;
  condition: BookCondition;
  transaction: TransactionType;
  price: Money;
  retailPrice?: Money;
  coverImage: string;
  description: string;
  seller: SellerRef;
  location: string;
  fulfilment: ('pickup' | 'delivery')[];
  status: ListingStatus;
  createdAt: string;
  origin: DataOrigin;
  tags: string[];
  reported?: boolean;
}

export type OpportunityType =
  | 'internship'
  | 'part-time'
  | 'full-time'
  | 'remote'
  | 'teaching'
  | 'seasonal'
  | 'adventure'
  | 'hospitality'
  | 'work-exchange'
  | 'volunteer'
  | 'programme';

export interface Opportunity {
  id: string;
  title: string;
  organisation: string;
  type: OpportunityType;
  categories: string[];
  location: string;
  country: string;
  countryCode: string;
  remote: boolean;
  compensation: {
    min: number;
    max: number;
    currency: Money['currency'];
    period: 'hour' | 'day' | 'week' | 'month' | 'total';
    note?: string;
  };
  durationWeeks: number;
  hoursPerWeek: number;
  startDate: string;
  deadline: string;
  experience: 'none' | 'some' | 'experienced';
  visaSupport: 'none' | 'eligible' | 'sponsored' | 'unknown';
  accommodation: string | null;
  travelSupport: string | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  image: string;
  sourceName: string;
  sourceUrl: string | null;
  verified: boolean;
  origin: DataOrigin;
  postedAt: string;
  tags: string[];
}

export type ApplicationStage = 'saved' | 'preparing' | 'applied' | 'interviewing' | 'completed';

export interface ApplicationRecord {
  opportunityId: string;
  stage: ApplicationStage;
  updatedAt: string;
  note: string;
  reminderAt: string | null;
}

/* -------------------------------------------------------------------- academic */

export interface Course {
  code: string;
  title: string;
  credits: number;
  faculty: string;
  facultyId: string;
  department: string;
  semester: number;
  accent: string;
  attendanceHeld: number;
  attendanceAttended: number;
  continuousAssessment: number;
  continuousAssessmentMax: number;
}

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6;

export interface ClassSession {
  id: string;
  courseCode: string;
  day: Weekday;
  start: string;
  end: string;
  room: string;
  kind: 'lecture' | 'lab' | 'tutorial' | 'seminar';
}

export type NoticeImportance = 'critical' | 'high' | 'normal';

export interface Notice {
  id: string;
  title: string;
  body: string;
  scope: 'university' | 'department' | 'course' | 'community';
  channel: string;
  department: string;
  courseCode: string | null;
  semester: number | null;
  importance: NoticeImportance;
  category: string;
  publishedAt: string;
  author: string;
  pinned: boolean;
  attachmentId: string | null;
  origin: DataOrigin;
}

export type AssignmentState = 'open' | 'submitted' | 'graded' | 'returned';

export interface Assignment {
  id: string;
  courseCode: string;
  title: string;
  brief: string;
  dueAt: string;
  maxMarks: number;
  state: AssignmentState;
  attachmentId: string | null;
  createdBy: string;
  origin: DataOrigin;
}

export interface Submission {
  assignmentId: string;
  submittedAt: string;
  method: 'file' | 'text';
  fileName: string | null;
  note: string;
  wordCount: number;
  marks: number | null;
  feedback: string | null;
  state: AssignmentState;
}

export interface ExamEntry {
  id: string;
  courseCode: string;
  title: string;
  date: string;
  start: string;
  durationMinutes: number;
  hall: string;
  seatRange: string;
  kind: 'midsem' | 'endsem' | 'practical' | 'viva';
}

export type DocumentCategory =
  | 'study-notes'
  | 'question-paper'
  | 'slides'
  | 'syllabus'
  | 'circular'
  | 'reading'
  | 'project';

export interface CampusDocument {
  id: string;
  title: string;
  courseCode: string | null;
  category: DocumentCategory;
  department: string;
  pages: number;
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  tags: string[];
  restricted: boolean;
  /** Demo documents render a paginated preview; a real file URL takes precedence. */
  fileUrl: string | null;
  preview: {
    heading: string;
    subheading: string;
    blocks: { kind: 'para' | 'list' | 'formula' | 'callout'; text: string }[];
  }[];
  downloads: number;
  origin: DataOrigin;
}

export interface FacultyMember {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  cabin: string;
  hours: string;
  courses: string[];
  researchAreas: string[];
  avatarSeed: string;
}

/* --------------------------------------------------------------------- parking */

export type ParkingEligibility = 'student' | 'faculty' | 'staff' | 'visitor';

export interface ParkingLot {
  id: string;
  name: string;
  code: string;
  zone: 'student' | 'faculty' | 'staff' | 'visitor' | 'mixed';
  capacity: number;
  accessibleSpaces: number;
  evSpaces: number;
  hours: string;
  eligibility: ParkingEligibility[];
  requiresReservation: boolean;
  feeNote: string;
  walkMinutes: Record<string, number>;
  /** Null means no live sensor integration — never presented as live data. */
  occupancy: {
    available: number;
    occupied: number;
    updatedAt: string;
    source: string;
  } | null;
  rules: string[];
  gridX: number;
  gridY: number;
  image: string;
  zones: { label: string; kind: 'standard' | 'accessible' | 'ev' | 'faculty'; spaces: number }[];
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed' | 'expired';

export interface Reservation {
  id: string;
  lotId: string;
  lotName: string;
  lotCode: string;
  zoneLabel: string;
  date: string;
  start: string;
  end: string;
  status: ReservationStatus;
  plate: string;
  reference: string;
  createdAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  origin: DataOrigin;
}

/* ------------------------------------------------------------------ cross-app */

export type SavedKind = 'book' | 'opportunity' | 'notice' | 'parking' | 'document' | 'assignment';

export interface SavedItem {
  id: string;
  kind: SavedKind;
  refId: string;
  title: string;
  subtitle: string;
  href: string;
  savedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  module: 'books' | 'opportunities' | 'academics' | 'parking' | 'system';
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
  read: boolean;
  href: string | null;
  origin: DataOrigin;
}

export interface MessageParticipant {
  id: string;
  name: string;
  role: Role;
  avatarSeed: string;
}

export interface Message {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  sentAt: string;
}

export interface MessageThread {
  id: string;
  subject: string;
  context: string;
  participants: MessageParticipant[];
  unread: number;
  messages: Message[];
}

export interface ReportRecord {
  id: string;
  kind: SavedKind | 'message' | 'seller';
  refId: string;
  refLabel: string;
  reason: string;
  detail: string;
  createdAt: string;
  status: 'received' | 'under-review' | 'closed';
}

export interface DashboardSectionPref {
  id: string;
  label: string;
  description: string;
  visible: boolean;
}

/* ------------------------------------------------------------------- searching */

export type SearchKind = SavedKind | 'course' | 'faculty' | 'exam';

export interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  keywords: string;
  badge?: string;
}
