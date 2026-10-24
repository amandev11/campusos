import { PHOTO, photo } from './media';
import { rel, todayAt } from './time';
import type {
  Assignment,
  CampusDocument,
  ClassSession,
  Course,
  DocumentCategory,
  ExamEntry,
  FacultyMember,
  Notice,
  Weekday,
} from '@/lib/types';

export const ACADEMIC_TERM = {
  name: 'Monsoon Semester 2026',
  semester: 5,
  startsOn: rel.days(-58),
  endsOn: rel.days(46),
  weekNumber: 9,
  totalWeeks: 15,
  institution: 'Meridian Institute of Technology',
  department: 'Computer Science & Engineering',
};

/* ------------------------------------------------------------------- courses */

export const COURSES: Course[] = [
  {
    code: 'CS301',
    title: 'Data Structures & Algorithms',
    credits: 4,
    faculty: 'Dr. Priya Raman',
    facultyId: 'fac-priya',
    department: 'Computer Science',
    semester: 5,
    accent: '#8BD8CB',
    attendanceHeld: 48,
    attendanceAttended: 42,
    continuousAssessment: 34,
    continuousAssessmentMax: 40,
  },
  {
    code: 'CS304',
    title: 'Operating Systems',
    credits: 4,
    faculty: 'Dr. Anand Verma',
    facultyId: 'fac-anand',
    department: 'Computer Science',
    semester: 5,
    accent: '#D8C39A',
    attendanceHeld: 46,
    attendanceAttended: 36,
    continuousAssessment: 27,
    continuousAssessmentMax: 40,
  },
  {
    code: 'CS305',
    title: 'Database Management Systems',
    credits: 3,
    faculty: 'Prof. Kavita Nair',
    facultyId: 'fac-kavita',
    department: 'Computer Science',
    semester: 5,
    accent: '#9BB8F0',
    attendanceHeld: 40,
    attendanceAttended: 38,
    continuousAssessment: 31,
    continuousAssessmentMax: 40,
  },
  {
    code: 'MA301',
    title: 'Discrete Mathematics & Graph Theory',
    credits: 3,
    faculty: 'Dr. Sunil Bhatt',
    facultyId: 'fac-sunil',
    department: 'Mathematics',
    semester: 5,
    accent: '#C9A8E8',
    attendanceHeld: 44,
    attendanceAttended: 33,
    continuousAssessment: 24,
    continuousAssessmentMax: 40,
  },
  {
    code: 'DS210',
    title: 'Interaction Design Studio',
    credits: 4,
    faculty: 'Prof. Nandita Rao',
    facultyId: 'fac-nandita',
    department: 'Design',
    semester: 5,
    accent: '#E8A8A0',
    attendanceHeld: 32,
    attendanceAttended: 30,
    continuousAssessment: 36,
    continuousAssessmentMax: 40,
  },
  {
    code: 'HS201',
    title: 'Technical Communication',
    credits: 2,
    faculty: 'Dr. Rakesh Menon',
    facultyId: 'fac-rakesh',
    department: 'Humanities',
    semester: 5,
    accent: '#A8D9A0',
    attendanceHeld: 24,
    attendanceAttended: 17,
    continuousAssessment: 18,
    continuousAssessmentMax: 20,
  },
  {
    code: 'EC305',
    title: 'Environmental Economics',
    credits: 3,
    faculty: 'Prof. Rekha Varma',
    facultyId: 'fac-rekha',
    department: 'Economics',
    semester: 5,
    accent: '#E0C97F',
    attendanceHeld: 28,
    attendanceAttended: 25,
    continuousAssessment: 22,
    continuousAssessmentMax: 30,
  },
];

export function courseByCode(code: string): Course | undefined {
  return COURSES.find((course) => course.code === code);
}

/* ----------------------------------------------------------------- timetable */

interface SessionSeed {
  courseCode: string;
  day: Weekday;
  start: string;
  end: string;
  room: string;
  kind: ClassSession['kind'];
}

const SESSION_SEEDS: SessionSeed[] = [
  { courseCode: 'CS301', day: 1, start: '09:00', end: '10:00', room: 'Lecture Hall 4', kind: 'lecture' },
  { courseCode: 'MA301', day: 1, start: '10:15', end: '11:15', room: 'Lecture Hall 2', kind: 'lecture' },
  { courseCode: 'CS304', day: 1, start: '14:00', end: '15:00', room: 'Lecture Hall 4', kind: 'lecture' },
  { courseCode: 'CS301', day: 1, start: '15:15', end: '17:15', room: 'Lab 3', kind: 'lab' },

  { courseCode: 'CS305', day: 2, start: '09:00', end: '10:00', room: 'Lecture Hall 1', kind: 'lecture' },
  { courseCode: 'HS201', day: 2, start: '11:30', end: '12:30', room: 'Seminar Room B', kind: 'seminar' },
  { courseCode: 'DS210', day: 2, start: '14:00', end: '17:00', room: 'Design Studio 1', kind: 'tutorial' },

  { courseCode: 'MA301', day: 3, start: '09:00', end: '10:00', room: 'Lecture Hall 2', kind: 'lecture' },
  { courseCode: 'CS304', day: 3, start: '10:15', end: '11:15', room: 'Lecture Hall 4', kind: 'lecture' },
  { courseCode: 'EC305', day: 3, start: '12:00', end: '13:00', room: 'Social Sciences 201', kind: 'lecture' },
  { courseCode: 'CS305', day: 3, start: '15:15', end: '17:15', room: 'Lab 2', kind: 'lab' },

  { courseCode: 'CS301', day: 4, start: '09:00', end: '10:00', room: 'Lecture Hall 4', kind: 'lecture' },
  { courseCode: 'CS305', day: 4, start: '10:15', end: '11:15', room: 'Lecture Hall 1', kind: 'lecture' },
  { courseCode: 'DS210', day: 4, start: '13:30', end: '16:30', room: 'Design Studio 1', kind: 'tutorial' },

  { courseCode: 'CS304', day: 5, start: '09:00', end: '10:00', room: 'Lecture Hall 4', kind: 'lecture' },
  { courseCode: 'EC305', day: 5, start: '10:15', end: '11:15', room: 'Social Sciences 201', kind: 'lecture' },
  { courseCode: 'HS201', day: 5, start: '12:00', end: '13:00', room: 'Seminar Room B', kind: 'seminar' },
  { courseCode: 'CS301', day: 5, start: '14:00', end: '15:00', room: 'Tutorial Room 6', kind: 'tutorial' },

  { courseCode: 'CS304', day: 6, start: '10:00', end: '12:00', room: 'Lab 1', kind: 'lab' },
  { courseCode: 'MA301', day: 6, start: '12:15', end: '13:15', room: 'Tutorial Room 3', kind: 'tutorial' },
];

export const SESSIONS: ClassSession[] = SESSION_SEEDS.map((seed, index) => ({
  id: `ses-${index + 1}`,
  ...seed,
}));

export const WEEKDAYS: { value: Weekday; short: string; long: string }[] = [
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
];

function toWeekday(date: Date): Weekday | null {
  const day = date.getDay();
  if (day === 0) return null;
  return day as Weekday;
}

export function sessionsForWeekday(day: Weekday): ClassSession[] {
  return SESSIONS.filter((session) => session.day === day).sort((a, b) => a.start.localeCompare(b.start));
}

export function todaySessions(now: Date = new Date()): ClassSession[] {
  const day = toWeekday(now);
  return day ? sessionsForWeekday(day) : [];
}

export function upcomingSessions(now: Date = new Date(), limit = 4): {
  session: ClassSession;
  offsetDays: number;
}[] {
  const today = toWeekday(now);
  const ordered: { session: ClassSession; offsetDays: number }[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const day = ((now.getDay() - 1 + offset + 7) % 7) + 1;
    if (offset === 0 && !today) continue;
    const sessions = sessionsForWeekday(day as Weekday);
    for (const session of sessions) {
      if (offset === 0 && session.end <= clockNow(now)) continue;
      ordered.push({ session, offsetDays: offset });
    }
  }
  return ordered.slice(0, limit);
}

export function clockNow(now: Date = new Date()): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------- notices */

interface NoticeSeed {
  id: string;
  title: string;
  body: string;
  scope: Notice['scope'];
  channel: string;
  department: string;
  courseCode?: string;
  importance: Notice['importance'];
  category: string;
  ageHours: number;
  author: string;
  pinned?: boolean;
  attachmentId?: string;
}

const NOTICE_SEEDS: NoticeSeed[] = [
  {
    id: 'nt-exam-datesheet',
    title: 'End-semester examination datesheet published',
    body: 'The provisional datesheet for the end-semester examinations is now available in the document library. Verify your registered courses against the list and report discrepancies to the examination cell within five working days. Seating allocations will be published two weeks before the first paper.',
    scope: 'university',
    channel: 'Examination Cell',
    department: 'Academic Affairs',
    importance: 'critical',
    category: 'Examinations',
    ageHours: 5,
    author: 'Controller of Examinations',
    pinned: true,
    attachmentId: 'doc-datesheet',
  },
  {
    id: 'nt-registration-window',
    title: 'Semester 6 course registration opens Monday',
    body: 'Registration for the Monsoon Semester 6 opens on Monday at 09:00 and closes on Friday at 17:00. Elective seats are allocated on a first-come basis; core courses are pre-loaded. Students with outstanding dues will be unable to register until cleared by the accounts office.',
    scope: 'university',
    channel: 'Academic Section',
    department: 'Academic Affairs',
    importance: 'high',
    category: 'Registration',
    ageHours: 26,
    author: 'Dean of Academics',
    pinned: true,
  },
  {
    id: 'nt-cs301-viva',
    title: 'CS301 lab viva moved to Thursday afternoon',
    body: 'Because of the departmental seminar on Wednesday, the CS301 lab viva will now take place on Thursday between 14:00 and 17:00 in Lab 3. Bring your signed lab file and the printed submission receipt. Groups 5 to 9 appear in the first slot.',
    scope: 'course',
    channel: 'Course announcement',
    department: 'Computer Science',
    courseCode: 'CS301',
    importance: 'high',
    category: 'Assessment',
    ageHours: 8,
    author: 'Dr. Priya Raman',
  },
  {
    id: 'nt-library-hours',
    title: 'Central Library extends hours during examination weeks',
    body: 'From the start of the study break the Central Library will remain open until 23:00 on weekdays and 20:00 on weekends. The reading room on the second floor will be reserved for silent study after 18:00.',
    scope: 'university',
    channel: 'Library Services',
    department: 'Central Library',
    importance: 'normal',
    category: 'Facilities',
    ageHours: 52,
    author: 'Chief Librarian',
  },
  {
    id: 'nt-hackathon',
    title: 'MeridianBuild 2026 — 36-hour campus hackathon',
    body: 'Registration for MeridianBuild opens today. Teams of up to four, any discipline. Problem statements cover campus mobility, accessibility and sustainable operations. Two tracks are reserved for first and second year students. Food and a quiet room to sleep in are provided.',
    scope: 'community',
    channel: 'Student council',
    department: 'Computer Science Society',
    importance: 'normal',
    category: 'Events',
    ageHours: 30,
    author: 'Computer Science Society',
  },
  {
    id: 'nt-placement-drive',
    title: 'Pre-placement talks begin next week',
    body: 'Six organisations will hold pre-placement talks in the auditorium over the coming fortnight. Attendance at a talk is mandatory before you may apply to that organisation. Bring your institute ID card; entry closes ten minutes after the scheduled start.',
    scope: 'university',
    channel: 'Career Development Cell',
    department: 'Training & Placement',
    importance: 'high',
    category: 'Placements',
    ageHours: 62,
    author: 'Head, Career Development Cell',
    attachmentId: 'doc-placement-calendar',
  },
  {
    id: 'nt-ma301-tutorial',
    title: 'MA301 tutorial group C shifted to Room 3',
    body: 'Tutorial group C moves to Tutorial Room 3 for the remainder of the semester because of the renovation work on the second floor. The timing is unchanged.',
    scope: 'course',
    channel: 'Course announcement',
    department: 'Mathematics',
    courseCode: 'MA301',
    importance: 'normal',
    category: 'Timetable',
    ageHours: 40,
    author: 'Dr. Sunil Bhatt',
  },
  {
    id: 'nt-parking-permit',
    title: 'Student parking permit renewal closes this month',
    body: 'Vehicle permit renewal for the coming term closes at the end of the month. Renewals require a valid registration certificate and institute ID. Two-wheeler permits are issued without a fee; four-wheeler student permits are limited to the North Deck allocation.',
    scope: 'university',
    channel: 'Campus Security',
    department: 'Estate Office',
    importance: 'normal',
    category: 'Campus',
    ageHours: 70,
    author: 'Estate Office',
  },
  {
    id: 'nt-scholarship',
    title: 'Merit-cum-means scholarship applications open',
    body: 'Applications for the merit-cum-means scholarship are open to students with a cumulative grade average above 8.0 and a family income below the notified threshold. Submit income certificates through the student portal; hard copies are not accepted.',
    scope: 'university',
    channel: 'Financial Aid Office',
    department: 'Student Welfare',
    importance: 'high',
    category: 'Scholarships',
    ageHours: 96,
    author: 'Dean of Student Welfare',
  },
  {
    id: 'nt-lab-safety',
    title: 'Mandatory lab safety refresher for all lab courses',
    body: 'All students enrolled in a laboratory course must complete the 40-minute online safety refresher before their next lab session. Lab entry will be denied until the completion certificate appears on your record.',
    scope: 'university',
    channel: 'Safety Office',
    department: 'Health & Safety',
    importance: 'critical',
    category: 'Safety',
    ageHours: 14,
    author: 'Institute Safety Officer',
  },
  {
    id: 'nt-design-review',
    title: 'DS210 mid-studio review — panels and timings',
    body: 'Mid-studio reviews run across two afternoons in the Design Studio. Each team has twelve minutes to present and eight for questions. External reviewers from two practice studios will join. Pin up work thirty minutes before your slot.',
    scope: 'course',
    channel: 'Course announcement',
    department: 'Design',
    courseCode: 'DS210',
    importance: 'normal',
    category: 'Assessment',
    ageHours: 20,
    author: 'Prof. Nandita Rao',
  },
  {
    id: 'nt-hostel-water',
    title: 'Scheduled water supply interruption in East Hostel',
    body: 'Maintenance on the overhead tanks will interrupt supply in East Hostel between 10:00 and 15:00 on Saturday. Tankers will be stationed near the mess for drinking water.',
    scope: 'community',
    channel: 'Hostel office',
    department: 'Estate Office',
    importance: 'normal',
    category: 'Facilities',
    ageHours: 44,
    author: 'Chief Warden',
  },
];

export const NOTICES: Notice[] = NOTICE_SEEDS.map((seed) => ({
  id: seed.id,
  title: seed.title,
  body: seed.body,
  scope: seed.scope,
  channel: seed.channel,
  department: seed.department,
  courseCode: seed.courseCode ?? null,
  semester: seed.scope === 'university' ? null : ACADEMIC_TERM.semester,
  importance: seed.importance,
  category: seed.category,
  publishedAt: rel.hours(-seed.ageHours),
  author: seed.author,
  pinned: seed.pinned ?? false,
  attachmentId: seed.attachmentId ?? null,
  origin: seed.scope === 'community' ? 'user' : 'demo',
}));

/* --------------------------------------------------------------- assignments */

interface AssignmentSeed {
  id: string;
  courseCode: string;
  title: string;
  brief: string;
  dueInDays: number;
  dueTime: string;
  maxMarks: number;
  state: Assignment['state'];
  attachmentId?: string;
}

const ASSIGNMENT_SEEDS: AssignmentSeed[] = [
  {
    id: 'as-design-report',
    title: 'Studio 3 — Usability findings and redesign proposal',
    courseCode: 'DS210',
    brief: 'Submit a written report of no more than 2,000 words with an annotated before-and-after of the flow you tested. Include your raw session notes as an appendix. Individual submission.',
    dueInDays: -1,
    dueTime: '23:59',
    maxMarks: 30,
    state: 'graded',
    attachmentId: 'doc-ds210-brief',
  },
  {
    id: 'as-dbms-normalisation',
    title: 'Normalisation assignment — library management schema',
    courseCode: 'CS305',
    brief: 'Take the provided denormalised schema and produce relations in 3NF. Show each decomposition step, list functional dependencies and state your assumptions. Submit as a single PDF.',
    dueInDays: 0,
    dueTime: '17:00',
    maxMarks: 20,
    state: 'open',
    attachmentId: 'doc-dbms-schema',
  },
  {
    id: 'as-os-scheduler',
    title: 'Lab 6 — Implement a multi-level feedback queue scheduler',
    courseCode: 'CS304',
    brief: 'Extend the provided simulator with a three-level feedback queue. Submit source code, a short design note and the timing chart for the three supplied workloads.',
    dueInDays: 1,
    dueTime: '23:59',
    maxMarks: 25,
    state: 'open',
    attachmentId: 'doc-os-lab',
  },
  {
    id: 'as-graph-proofs',
    title: 'Problem set 7 — Connectivity and spanning trees',
    courseCode: 'MA301',
    brief: 'Complete questions 4 to 11 of the problem set. Full proofs required; unsupported answers receive partial credit only. Handwritten submissions are accepted if legible.',
    dueInDays: 3,
    dueTime: '09:00',
    maxMarks: 15,
    state: 'open',
  },
  {
    id: 'as-dsa-amortised',
    title: 'Amortised analysis — written response',
    courseCode: 'CS301',
    brief: 'Explain the amortised cost of the dynamic array growth strategy and of the two-stack queue. Compare the accounting and potential methods on one worked example.',
    dueInDays: 6,
    dueTime: '23:59',
    maxMarks: 20,
    state: 'submitted',
  },
  {
    id: 'as-env-policy',
    title: 'Policy brief — carbon pricing in a developing economy',
    courseCode: 'EC305',
    brief: 'A 1,500-word policy brief for a minister with no economics background. Use at least three peer-reviewed sources and one national dataset. Cite the dataset properly.',
    dueInDays: 9,
    dueTime: '18:00',
    maxMarks: 25,
    state: 'open',
  },
  {
    id: 'as-hs-portfolio',
    title: 'Technical writing portfolio',
    courseCode: 'HS201',
    brief: 'Compile three documents you produced this semester — one specification, one instructional piece, one executive summary — with a short reflection on each revision you made.',
    dueInDays: 14,
    dueTime: '23:59',
    maxMarks: 20,
    state: 'open',
  },
  {
    id: 'as-dbms-project',
    title: 'Term project — design and build a working database application',
    courseCode: 'CS305',
    brief: 'Groups of three. Deliver a schema, a populated database, an application layer and a demonstration. Group marks are individualised using the peer assessment form.',
    dueInDays: 21,
    dueTime: '23:59',
    maxMarks: 50,
    state: 'open',
    attachmentId: 'doc-dbms-project',
  },
];

export const ASSIGNMENTS: Assignment[] = ASSIGNMENT_SEEDS.map((seed) => {
  const course = courseByCode(seed.courseCode);
  return {
    id: seed.id,
    courseCode: seed.courseCode,
    title: seed.title,
    brief: seed.brief,
    dueAt: todayAt(seed.dueTime, seed.dueInDays),
    maxMarks: seed.maxMarks,
    state: seed.state,
    attachmentId: seed.attachmentId ?? null,
    createdBy: course?.faculty ?? 'Faculty',
    origin: 'demo',
  };
});

/** Pre-existing submission shown for work that was already handed in. */
export const SEEDED_SUBMISSIONS = [
  {
    assignmentId: 'as-design-report',
    submittedAt: rel.days(-4),
    marks: 26,
    feedback:
      'Clear methodology and honest about the small sample. The annotated flow is much stronger than the written section — lead with it next time.',
  },
  {
    assignmentId: 'as-dsa-amortised',
    submittedAt: rel.hours(-30),
    marks: null,
    feedback: null,
  },
] as const;

/* ---------------------------------------------------------------------- exams */

export const EXAMS: ExamEntry[] = [
  {
    id: 'ex-1',
    courseCode: 'CS301',
    title: 'Data Structures & Algorithms',
    date: rel.date(18),
    start: '09:30',
    durationMinutes: 180,
    hall: 'Examination Hall A',
    seatRange: 'Rows 21–28',
    kind: 'endsem',
  },
  {
    id: 'ex-2',
    courseCode: 'CS304',
    title: 'Operating Systems',
    date: rel.date(21),
    start: '09:30',
    durationMinutes: 180,
    hall: 'Examination Hall A',
    seatRange: 'Rows 21–28',
    kind: 'endsem',
  },
  {
    id: 'ex-3',
    courseCode: 'MA301',
    title: 'Discrete Mathematics & Graph Theory',
    date: rel.date(24),
    start: '14:00',
    durationMinutes: 120,
    hall: 'Examination Hall B',
    seatRange: 'Rows 3–9',
    kind: 'endsem',
  },
  {
    id: 'ex-4',
    courseCode: 'CS305',
    title: 'Database Management Systems',
    date: rel.date(27),
    start: '09:30',
    durationMinutes: 120,
    hall: 'Examination Hall B',
    seatRange: 'Rows 3–9',
    kind: 'endsem',
  },
  {
    id: 'ex-5',
    courseCode: 'DS210',
    title: 'Interaction Design Studio — viva',
    date: rel.date(30),
    start: '10:00',
    durationMinutes: 45,
    hall: 'Design Studio 1',
    seatRange: 'Slot 6 of 14',
    kind: 'viva',
  },
  {
    id: 'ex-6',
    courseCode: 'CS304',
    title: 'Operating Systems — practical',
    date: rel.date(8),
    start: '14:00',
    durationMinutes: 120,
    hall: 'Lab 1',
    seatRange: 'Bench 12',
    kind: 'practical',
  },
];

/* ------------------------------------------------------------------ documents */

interface DocSeed {
  id: string;
  title: string;
  courseCode: string | null;
  category: DocumentCategory;
  pages: number;
  sizeKb: number;
  uploadedBy: string;
  ageHours: number;
  tags: string[];
  restricted?: boolean;
  fileUrl?: string;
}

const DOC_SEEDS: DocSeed[] = [
  {
    id: 'doc-datesheet',
    title: 'End-semester examination datesheet — provisional',
    courseCode: null,
    category: 'circular',
    pages: 4,
    sizeKb: 384,
    uploadedBy: 'Examination Cell',
    ageHours: 5,
    tags: ['examination', 'datesheet', 'official'],
  },
  {
    id: 'doc-dsa-notes',
    title: 'CS301 — Complete lecture notes, weeks 1 to 9',
    courseCode: 'CS301',
    category: 'study-notes',
    pages: 148,
    sizeKb: 3280,
    uploadedBy: 'Dr. Priya Raman',
    ageHours: 22,
    tags: ['lecture notes', 'algorithms', 'revision'],
  },
  {
    id: 'doc-dbms-schema',
    title: 'CS305 — Library management denormalised schema',
    courseCode: 'CS305',
    category: 'slides',
    pages: 12,
    sizeKb: 720,
    uploadedBy: 'Prof. Kavita Nair',
    ageHours: 48,
    tags: ['assignment', 'normalisation', 'schema'],
  },
  {
    id: 'doc-os-lab',
    title: 'CS304 — Lab 6 scheduler simulator and workloads',
    courseCode: 'CS304',
    category: 'project',
    pages: 9,
    sizeKb: 512,
    uploadedBy: 'Dr. Anand Verma',
    ageHours: 30,
    tags: ['lab', 'scheduler', 'source included'],
  },
  {
    id: 'doc-dsa-question-bank',
    title: 'CS301 — Previous five years of mid-semester papers',
    courseCode: 'CS301',
    category: 'question-paper',
    pages: 32,
    sizeKb: 1180,
    uploadedBy: 'Computer Science Society',
    ageHours: 96,
    tags: ['question papers', 'practice', 'archive'],
  },
  {
    id: 'doc-ma301-problem-set',
    title: 'MA301 — Problem set 7 with worked solutions',
    courseCode: 'MA301',
    category: 'study-notes',
    pages: 16,
    sizeKb: 640,
    uploadedBy: 'Dr. Sunil Bhatt',
    ageHours: 60,
    tags: ['problem set', 'graph theory'],
  },
  {
    id: 'doc-ds210-brief',
    title: 'DS210 — Studio 3 project brief and assessment rubric',
    courseCode: 'DS210',
    category: 'project',
    pages: 6,
    sizeKb: 288,
    uploadedBy: 'Prof. Nandita Rao',
    ageHours: 110,
    tags: ['studio brief', 'rubric'],
  },
  {
    id: 'doc-dbms-project',
    title: 'CS305 — Term project specification and peer assessment form',
    courseCode: 'CS305',
    category: 'project',
    pages: 8,
    sizeKb: 402,
    uploadedBy: 'Prof. Kavita Nair',
    ageHours: 74,
    tags: ['term project', 'group work'],
  },
  {
    id: 'doc-syllabus-cs',
    title: 'Computer Science — Semester 5 syllabus and credit distribution',
    courseCode: null,
    category: 'syllabus',
    pages: 22,
    sizeKb: 890,
    uploadedBy: 'Academic Section',
    ageHours: 320,
    tags: ['syllabus', 'credits', 'official'],
  },
  {
    id: 'doc-placement-calendar',
    title: 'Placement season calendar and eligibility criteria',
    courseCode: null,
    category: 'circular',
    pages: 5,
    sizeKb: 310,
    uploadedBy: 'Training & Placement',
    ageHours: 62,
    tags: ['placements', 'eligibility'],
  },
  {
    id: 'doc-ec305-reading',
    title: 'EC305 — Reading list and dataset sources for the policy brief',
    courseCode: 'EC305',
    category: 'reading',
    pages: 7,
    sizeKb: 240,
    uploadedBy: 'Prof. Rekha Varma',
    ageHours: 140,
    tags: ['reading list', 'datasets'],
  },
  {
    id: 'doc-lab-records',
    title: 'CS304 — Consolidated laboratory attendance records',
    courseCode: 'CS304',
    category: 'circular',
    pages: 3,
    sizeKb: 180,
    uploadedBy: 'Department Office',
    ageHours: 200,
    tags: ['attendance', 'records'],
    restricted: true,
  },
  {
    id: 'doc-risk-assessment',
    title: 'Institute risk register — restricted distribution',
    courseCode: null,
    category: 'circular',
    pages: 18,
    sizeKb: 720,
    uploadedBy: 'Institute Administration',
    ageHours: 400,
    tags: ['restricted', 'administration'],
    restricted: true,
  },
];

const CATEGORY_TITLES: Record<DocumentCategory, string> = {
  'study-notes': 'Study notes',
  'question-paper': 'Question paper',
  slides: 'Lecture slides',
  syllabus: 'Syllabus',
  circular: 'Official circular',
  reading: 'Reading material',
  project: 'Project material',
};

/**
 * Demo documents render a real, paginated preview built from structured
 * content. Nothing pretends to be a scanned institutional PDF.
 */
function buildPreview(seed: DocSeed): CampusDocument['preview'] {
  const course = seed.courseCode ? courseByCode(seed.courseCode) : undefined;
  const topic = seed.title.replace(/^[A-Z]{2}\d{3}\s—\s/, '');
  return [
    {
      heading: topic,
      subheading: `${CATEGORY_TITLES[seed.category]}${course ? ` · ${course.code} ${course.title}` : ''}`,
      blocks: [
        {
          kind: 'callout',
          text: 'Demonstration document. This preview is generated from structured sample content, not from an institutional file store.',
        },
        {
          kind: 'para',
          text: 'This material accompanies the sessions listed in the course timetable. Read it before the corresponding lecture; the sessions assume you have already worked through the definitions and can spend the hour on discussion instead of dictation.',
        },
        {
          kind: 'list',
          text: 'Scope of this document|Terminology and formal definitions|Worked examples drawn from past assessments|Common mistakes and how they are marked|Further reading and dataset sources',
        },
        {
          kind: 'para',
          text: 'Assessment weight sits with application rather than recall. Answers that reproduce a definition without using it on the given instance are marked accordingly.',
        },
      ],
    },
    {
      heading: 'Formal statement',
      subheading: 'Section 2.1',
      blocks: [
        {
          kind: 'para',
          text: 'Let a structure be given together with the operations defined over it. The analysis below establishes a bound on the cost of those operations over a sequence of requests, rather than on a single request in isolation.',
        },
        { kind: 'formula', text: 'T(n) = Σᵢ₌₁ⁿ cᵢ  ≤  n · ā   where ā is the amortised cost per operation' },
        {
          kind: 'list',
          text: 'Accounting method — credit each operation with a fixed charge|Potential method — define a potential function over the state|Aggregate method — bound the total directly for simple cases',
        },
        {
          kind: 'para',
          text: 'Choose the method that makes the invariant easiest to state. Mixing methods in one solution is permitted but usually obscures the argument.',
        },
      ],
    },
    {
      heading: 'Worked example',
      subheading: 'Section 3.4',
      blocks: [
        {
          kind: 'para',
          text: 'The example below uses the aggregate method. Track the array capacity after each insertion and note where the cost is concentrated.',
        },
        { kind: 'formula', text: 'Capacity: 1 → 2 → 4 → 8 → … → 2ᵏ ; total copy cost = 2ᵏ⁺¹ − 1' },
        {
          kind: 'list',
          text: 'Insertions 1 to 2 — one copy|Insertions 3 to 4 — three copies|Insertions 5 to 8 — seven copies|Amortised cost per insertion remains constant at three',
        },
        {
          kind: 'callout',
          text: 'Takeaway — worst-case cost per operation and amortised cost per operation are different claims. State clearly which one you are proving.',
        },
      ],
    },
  ];
}

export const DOCUMENTS: CampusDocument[] = DOC_SEEDS.map((seed) => ({
  id: seed.id,
  title: seed.title,
  courseCode: seed.courseCode,
  category: seed.category,
  department: seed.courseCode
    ? (courseByCode(seed.courseCode)?.department ?? ACADEMIC_TERM.department)
    : 'Academic Affairs',
  pages: seed.pages,
  sizeKb: seed.sizeKb,
  uploadedAt: rel.hours(-seed.ageHours),
  uploadedBy: seed.uploadedBy,
  tags: seed.tags,
  restricted: seed.restricted ?? false,
  fileUrl: seed.fileUrl ?? null,
  preview: buildPreview(seed),
  downloads: 40 + (seed.pages * 7 + seed.tags.length * 13) % 480,
  origin: 'demo',
}));

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = (
  Object.keys(CATEGORY_TITLES) as DocumentCategory[]
).map((value) => ({ value, label: CATEGORY_TITLES[value] }));

/* ------------------------------------------------------------------ faculty */

export const FACULTY: FacultyMember[] = [
  {
    id: 'fac-priya',
    name: 'Dr. Priya Raman',
    title: 'Associate Professor',
    department: 'Computer Science & Engineering',
    email: 'priya.raman@campus.edu',
    cabin: 'Block C, room 312',
    hours: 'Tue & Thu, 15:00–17:00',
    courses: ['CS301'],
    researchAreas: ['Algorithms', 'Graph theory', 'Algorithmic fairness'],
    avatarSeed: 'priya-raman',
  },
  {
    id: 'fac-anand',
    name: 'Dr. Anand Verma',
    title: 'Professor & Head',
    department: 'Computer Science & Engineering',
    email: 'anand.verma@campus.edu',
    cabin: 'Block C, room 401',
    hours: 'Mon & Wed, 11:00–12:30',
    courses: ['CS304'],
    researchAreas: ['Operating systems', 'Distributed storage'],
    avatarSeed: 'anand-verma',
  },
  {
    id: 'fac-kavita',
    name: 'Prof. Kavita Nair',
    title: 'Assistant Professor',
    department: 'Computer Science & Engineering',
    email: 'kavita.nair@campus.edu',
    cabin: 'Block C, room 208',
    hours: 'Wed, 14:00–16:00',
    courses: ['CS305'],
    researchAreas: ['Databases', 'Query optimisation', 'Data privacy'],
    avatarSeed: 'kavita-nair',
  },
  {
    id: 'fac-sunil',
    name: 'Dr. Sunil Bhatt',
    title: 'Assistant Professor',
    department: 'Mathematics',
    email: 'sunil.bhatt@campus.edu',
    cabin: 'Block A, room 118',
    hours: 'Mon & Fri, 10:00–11:30',
    courses: ['MA301'],
    researchAreas: ['Combinatorics', 'Graph theory'],
    avatarSeed: 'sunil-bhatt',
  },
  {
    id: 'fac-nandita',
    name: 'Prof. Nandita Rao',
    title: 'Professor of Practice',
    department: 'Design',
    email: 'nandita.rao@campus.edu',
    cabin: 'Studio Wing, room 5',
    hours: 'Tue & Thu, 13:00–15:00',
    courses: ['DS210'],
    researchAreas: ['Interaction design', 'Design research', 'Accessibility'],
    avatarSeed: 'nandita-rao',
  },
  {
    id: 'fac-rakesh',
    name: 'Dr. Rakesh Menon',
    title: 'Assistant Professor',
    department: 'Humanities & Social Sciences',
    email: 'rakesh.menon@campus.edu',
    cabin: 'Block D, room 210',
    hours: 'Fri, 11:00–13:00',
    courses: ['HS201'],
    researchAreas: ['Technical communication', 'Rhetoric'],
    avatarSeed: 'rakesh-menon',
  },
  {
    id: 'fac-rekha',
    name: 'Prof. Rekha Varma',
    title: 'Visiting Faculty',
    department: 'Economics',
    email: 'rekha.varma@campus.edu',
    cabin: 'Social Sciences, room 214',
    hours: 'Wed, 13:00–15:00',
    courses: ['EC305'],
    researchAreas: ['Environmental economics', 'Climate policy'],
    avatarSeed: 'rekha-varma',
  },
  {
    id: 'fac-welfare',
    name: 'Anjali Deshmukh',
    title: 'Dean of Student Welfare',
    department: 'Student Affairs',
    email: 'welfare@campus.edu',
    cabin: 'Administration Building, room 12',
    hours: 'Mon to Fri, 10:00–16:00',
    courses: [],
    researchAreas: ['Student support', 'Accessibility services'],
    avatarSeed: 'anjali-deshmukh',
  },
];

/* ------------------------------------------------------------ derived helpers */

export const ACADEMIC_CALENDAR = [
  { id: 'cal-1', label: 'Mid-semester break', date: rel.date(-6), kind: 'break' as const },
  { id: 'cal-2', label: 'Registration for Semester 6 opens', date: rel.date(4), kind: 'admin' as const },
  { id: 'cal-3', label: 'MeridianBuild hackathon', date: rel.date(9), kind: 'event' as const },
  { id: 'cal-4', label: 'Last teaching week', date: rel.date(15), kind: 'admin' as const },
  { id: 'cal-5', label: 'Study break begins', date: rel.date(16), kind: 'break' as const },
  { id: 'cal-6', label: 'End-semester examinations begin', date: rel.date(18), kind: 'exam' as const },
  { id: 'cal-7', label: 'Semester ends', date: rel.date(46), kind: 'admin' as const },
];

export const CAMPUS_EVENTS = [
  {
    id: 'ev-1',
    title: 'MeridianBuild 36-hour hackathon',
    date: rel.days(9),
    venue: 'Innovation Centre, Block F',
    host: 'Computer Science Society',
    image: photo(PHOTO.coding, { w: 800, h: 500 }),
  },
  {
    id: 'ev-2',
    title: 'Studio open review — interaction design',
    date: rel.days(5),
    venue: 'Design Studio 1',
    host: 'Department of Design',
    image: photo(PHOTO.studio, { w: 800, h: 500 }),
  },
  {
    id: 'ev-3',
    title: 'Pre-placement talk — Marrow Advisory',
    date: rel.days(2),
    venue: 'Main Auditorium',
    host: 'Career Development Cell',
    image: photo(PHOTO.consulting, { w: 800, h: 500 }),
  },
  {
    id: 'ev-4',
    title: 'Library research skills workshop',
    date: rel.days(7),
    venue: 'Central Library, 2nd floor',
    host: 'Library Services',
    image: photo(PHOTO.library, { w: 800, h: 500 }),
  },
];
