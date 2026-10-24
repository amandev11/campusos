import { rel } from './time';
import type { AppNotification, MessageThread, Profile } from '@/lib/types';

/* ---------------------------------------------------------------- accounts */

export interface AccountSeed extends Profile {
  /** Digest of the demo password. Local-only; never a real credential store. */
  password: string;
}

export const DEMO_PASSWORD = 'campusos';

export const ACCOUNT_SEEDS: AccountSeed[] = [
  {
    id: 'usr-aarav',
    name: 'Aarav Mehta',
    email: 'aarav@campus.edu',
    role: 'student',
    avatarSeed: 'aarav-mehta',
    university: 'Meridian Institute of Technology',
    programme: 'B.Tech Computer Science & Engineering',
    department: 'Computer Science & Engineering',
    semester: 5,
    interests: ['Algorithms', 'Design', 'Travel work', 'Sustainability'],
    parkingEligibility: 'student',
    vehicleLabel: 'DL 8C AB 4412',
    bio: 'Fifth-semester CS student. Spends too long in the design studio for someone not enrolled in it.',
    joinedAt: rel.days(-620),
    studentId: 'MIT2024CS0117',
    onboarded: true,
    password: DEMO_PASSWORD,
  },
  {
    id: 'usr-priya',
    name: 'Dr. Priya Raman',
    email: 'priya@campus.edu',
    role: 'faculty',
    avatarSeed: 'priya-raman',
    university: 'Meridian Institute of Technology',
    programme: 'Faculty — Computer Science & Engineering',
    department: 'Computer Science & Engineering',
    semester: 0,
    interests: ['Algorithms', 'Algorithmic fairness', 'Teaching'],
    parkingEligibility: 'faculty',
    vehicleLabel: 'DL 3C AE 9021',
    bio: 'Associate Professor. Teaches CS301 and supervises the algorithms reading group.',
    joinedAt: rel.days(-1650),
    studentId: 'FAC-CS-014',
    onboarded: true,
    password: DEMO_PASSWORD,
  },
  {
    id: 'usr-kapoor',
    name: 'Suresh Kapoor',
    email: 'registrar@campus.edu',
    role: 'admin',
    avatarSeed: 'suresh-kapoor',
    university: 'Meridian Institute of Technology',
    programme: 'Office of the Registrar',
    department: 'Academic Affairs',
    semester: 0,
    interests: ['Academic operations', 'Compliance'],
    parkingEligibility: 'staff',
    vehicleLabel: 'DL 1C AD 3390',
    bio: 'Registrar. Owns institution-wide notices, access control and the academic calendar.',
    joinedAt: rel.days(-2400),
    studentId: 'ADM-REG-001',
    onboarded: true,
    password: DEMO_PASSWORD,
  },
];

/** A brand-new account with no activity, used to demonstrate empty states. */
export function makeFreshProfile(id: string, name: string, email: string): Profile {
  return {
    id,
    name,
    email,
    role: 'student',
    avatarSeed: `fresh-${id}`,
    university: '',
    programme: '',
    department: '',
    semester: 1,
    interests: [],
    parkingEligibility: 'student',
    vehicleLabel: '',
    bio: '',
    joinedAt: new Date().toISOString(),
    studentId: '',
    onboarded: false,
  };
}

/* ----------------------------------------------------------- notifications */

interface NotificationSeed {
  id: string;
  title: string;
  body: string;
  module: AppNotification['module'];
  priority: AppNotification['priority'];
  hoursAgo: number;
  read: boolean;
  href: string | null;
}

const NOTIFICATION_SEEDS: NotificationSeed[] = [
  {
    id: 'nf-1',
    title: 'End-semester datesheet published',
    body: 'Your six registered papers are listed. Check the seat ranges before the first exam.',
    module: 'academics',
    priority: 'high',
    hoursAgo: 5,
    read: false,
    href: '/academics/exams',
  },
  {
    id: 'nf-2',
    title: 'CS305 normalisation assignment due today',
    body: 'Due at 17:00. The schema handout is attached to the assignment.',
    module: 'academics',
    priority: 'high',
    hoursAgo: 3,
    read: false,
    href: '/academics/assignments/as-dbms-normalisation',
  },
  {
    id: 'nf-3',
    title: 'Your North Deck reservation is confirmed',
    body: 'Level 2 shaded, tomorrow 08:30–13:30. Reference CAMP-ND1-88421.',
    module: 'parking',
    priority: 'normal',
    hoursAgo: 22,
    read: false,
    href: '/parking/bookings',
  },
  {
    id: 'nf-4',
    title: 'Application deadline in 7 days',
    body: 'Fieldnote — Product Design Intern (Remote) closes its applications next week.',
    module: 'opportunities',
    priority: 'normal',
    hoursAgo: 30,
    read: false,
    href: '/opportunities/op-remote-design',
  },
  {
    id: 'nf-5',
    title: 'Someone asked about your Clean Code listing',
    body: 'Ahana received your question about the dust jacket. Demo data — replies are not sent anywhere.',
    module: 'books',
    priority: 'low',
    hoursAgo: 34,
    read: true,
    href: '/books/bk-clean-code',
  },
  {
    id: 'nf-6',
    title: 'Lab safety refresher outstanding',
    body: 'Complete the 40-minute refresher before your next CS304 lab session.',
    module: 'academics',
    priority: 'high',
    hoursAgo: 44,
    read: true,
    href: '/academics/notices/nt-lab-safety',
  },
  {
    id: 'nf-7',
    title: 'CS301 lab viva moved to Thursday',
    body: 'Now in Lab 3 between 14:00 and 17:00. Groups 5 to 9 in the first slot.',
    module: 'academics',
    priority: 'normal',
    hoursAgo: 8,
    read: false,
    href: '/academics/notices/nt-cs301-viva',
  },
  {
    id: 'nf-8',
    title: 'Two new documents in your courses',
    body: 'CS304 Lab 6 simulator and MA301 problem set 7 are now in the library.',
    module: 'academics',
    priority: 'low',
    hoursAgo: 60,
    read: true,
    href: '/academics/library',
  },
  {
    id: 'nf-9',
    title: 'Library closes at 23:00 from next week',
    body: 'Extended opening hours begin with the study break.',
    module: 'system',
    priority: 'low',
    hoursAgo: 52,
    read: true,
    href: '/academics/notices/nt-library-hours',
  },
];

export const NOTIFICATIONS: AppNotification[] = NOTIFICATION_SEEDS.map((seed) => ({
  id: seed.id,
  title: seed.title,
  body: seed.body,
  module: seed.module,
  priority: seed.priority,
  createdAt: rel.hours(-seed.hoursAgo),
  read: seed.read,
  href: seed.href,
  origin: 'demo',
}));

/* ------------------------------------------------------------------ messaging */

export const MESSAGE_THREADS: MessageThread[] = [
  {
    id: 'th-ahana',
    subject: 'Clean Code — dust jacket',
    context: 'Books & Resources · listing enquiry',
    participants: [
      { id: 'usr-aarav', name: 'Aarav Mehta', role: 'student', avatarSeed: 'aarav-mehta' },
      { id: 'sel-ahana', name: 'Ahana Sen', role: 'student', avatarSeed: 'ahana-sen' },
    ],
    unread: 1,
    messages: [
      {
        id: 'msg-1',
        threadId: 'th-ahana',
        authorId: 'usr-aarav',
        body: 'Is the dust jacket included, and could you do ₹760 if I collect it from Gate 2 on Saturday?',
        sentAt: rel.hours(-36),
      },
      {
        id: 'msg-2',
        threadId: 'th-ahana',
        authorId: 'sel-ahana',
        body: 'Jacket is included. ₹780 and it is yours — I can meet at Gate 2 between 11:00 and 13:00.',
        sentAt: rel.hours(-34),
      },
    ],
  },
  {
    id: 'th-priya',
    subject: 'CS301 lab viva grouping',
    context: 'Academic Hub · course channel',
    participants: [
      { id: 'usr-aarav', name: 'Aarav Mehta', role: 'student', avatarSeed: 'aarav-mehta' },
      { id: 'fac-priya', name: 'Dr. Priya Raman', role: 'faculty', avatarSeed: 'priya-raman' },
    ],
    unread: 0,
    messages: [
      {
        id: 'msg-3',
        threadId: 'th-priya',
        authorId: 'usr-aarav',
        body: 'Ma’am, our group is in slot 2 on Thursday. Should we bring the printed lab file for all four members?',
        sentAt: rel.hours(-9),
      },
      {
        id: 'msg-4',
        threadId: 'th-priya',
        authorId: 'fac-priya',
        body: 'One file per group is enough, with all four names on the cover. Bring the submission receipts too.',
        sentAt: rel.hours(-8),
      },
    ],
  },
  {
    id: 'th-estate',
    subject: 'North Deck reservation change',
    context: 'Campus Parking · booking support',
    participants: [
      { id: 'usr-aarav', name: 'Aarav Mehta', role: 'student', avatarSeed: 'aarav-mehta' },
      { id: 'usr-kapoor', name: 'Estate Office', role: 'admin', avatarSeed: 'estate-office' },
    ],
    unread: 0,
    messages: [
      {
        id: 'msg-5',
        threadId: 'th-estate',
        authorId: 'usr-kapoor',
        body: 'Level 2 shaded will be closed for line marking on the 12th. Your booking has been shifted to Level 3 at the same times.',
        sentAt: rel.days(-2),
      },
    ],
  },
  {
    id: 'th-placement',
    subject: 'Pre-placement talk attendance',
    context: 'Travel & Work · application support',
    participants: [
      { id: 'usr-aarav', name: 'Aarav Mehta', role: 'student', avatarSeed: 'aarav-mehta' },
      { id: 'fac-welfare', name: 'Career Development Cell', role: 'faculty', avatarSeed: 'cdc' },
    ],
    unread: 2,
    messages: [
      {
        id: 'msg-6',
        threadId: 'th-placement',
        authorId: 'fac-welfare',
        body: 'Attendance at the Marrow Advisory talk is now open for registration on the noticeboard.',
        sentAt: rel.hours(-20),
      },
      {
        id: 'msg-7',
        threadId: 'th-placement',
        authorId: 'fac-welfare',
        body: 'Bring your institute ID — entry closes ten minutes after the start.',
        sentAt: rel.hours(-19),
      },
    ],
  },
];

/* ---------------------------------------------------------------- dashboard */

export const DASHBOARD_SECTION_SEEDS = [
  {
    id: 'agenda',
    label: 'Today’s schedule',
    description: 'Classes, attendance shortcut and the next session of the day.',
  },
  {
    id: 'deadlines',
    label: 'Deadlines',
    description: 'Assignments and examinations in the next three weeks.',
  },
  {
    id: 'featured',
    label: 'Featured this week',
    description: 'The single most relevant announcement or opportunity.',
  },
  {
    id: 'notices',
    label: 'Notices',
    description: 'Pinned and critical academic announcements.',
  },
  {
    id: 'resources',
    label: 'Recent resources',
    description: 'Latest documents added to your courses.',
  },
  {
    id: 'books',
    label: 'Recommended books',
    description: 'Used copies matched to your registered courses.',
  },
  {
    id: 'opportunities',
    label: 'Opportunities for you',
    description: 'Internships and seasonal roles matching your interests.',
  },
  {
    id: 'parking',
    label: 'Parking',
    description: 'Current and upcoming reservations plus availability.',
  },
  {
    id: 'activity',
    label: 'Recent activity',
    description: 'Applications, saved items and reading progress.',
  },
];

/** Honest, rule-based suggestions. No model is configured, so nothing pretends to be one. */
export function recommendationReason(kind: string, match: string[]): string {
  if (match.length === 0) return `Newly added to ${kind}`;
  return `Matches your ${match.length === 1 ? 'interest in' : 'interests in'} ${match.join(' and ')}`;
}
