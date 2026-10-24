import {
  BookOpen,
  Bookmark,
  Bell,
  CalendarDays,
  CircleParking,
  ClipboardList,
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  MapPin,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  /** Short description used by the command palette and tooltips. */
  description: string;
  badgeKey?: 'notifications' | 'messages' | 'saved' | 'assignments';
  /** Match nested routes under this prefix. */
  match?: string[];
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const PRIMARY_NAV: NavSection[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/',
        icon: <LayoutDashboard className="size-[1.125rem]" />,
        description: 'Your day across every module',
      },
      {
        id: 'academics',
        label: 'Academic Hub',
        href: '/academics',
        icon: <GraduationCap className="size-[1.125rem]" />,
        description: 'Timetable, attendance, assignments, notices, documents',
        badgeKey: 'assignments',
        match: ['/academics'],
      },
      {
        id: 'books',
        label: 'Books & Resources',
        href: '/books',
        icon: <BookOpen className="size-[1.125rem]" />,
        description: 'Buy, sell, borrow and share academic books',
        match: ['/books'],
      },
      {
        id: 'opportunities',
        label: 'Travel & Work',
        href: '/opportunities',
        icon: <Compass className="size-[1.125rem]" />,
        description: 'Internships, seasonal work, teaching and travel',
        match: ['/opportunities'],
      },
      {
        id: 'parking',
        label: 'Campus Parking',
        href: '/parking',
        icon: <CircleParking className="size-[1.125rem]" />,
        description: 'Availability, eligibility and reservations',
        match: ['/parking'],
      },
    ],
  },
  {
    id: 'personal',
    label: 'Personal',
    items: [
      {
        id: 'messages',
        label: 'Messages',
        href: '/messages',
        icon: <MessageSquare className="size-[1.125rem]" />,
        description: 'Conversations with sellers, faculty and offices',
        badgeKey: 'messages',
        match: ['/messages'],
      },
      {
        id: 'saved',
        label: 'Saved',
        href: '/saved',
        icon: <Bookmark className="size-[1.125rem]" />,
        description: 'Everything you bookmarked, in one place',
        badgeKey: 'saved',
        match: ['/saved'],
      },
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/notifications',
        icon: <Bell className="size-[1.125rem]" />,
        description: 'Deadlines, replies and updates',
        badgeKey: 'notifications',
        match: ['/notifications'],
      },
      {
        id: 'settings',
        label: 'Profile & Settings',
        href: '/settings',
        icon: <Settings className="size-[1.125rem]" />,
        description: 'Account, preferences, integrations and data',
        match: ['/settings', '/profile'],
      },
    ],
  },
];

export const ALL_NAV_ITEMS = PRIMARY_NAV.flatMap((section) => section.items);

/** Destinations that earn a place in the mobile tab bar. */
export const MOBILE_TABS: NavItem[] = [
  PRIMARY_NAV[0]!.items[0]!, // Overview
  PRIMARY_NAV[0]!.items[1]!, // Academic Hub
  PRIMARY_NAV[0]!.items[2]!, // Books
  PRIMARY_NAV[0]!.items[4]!, // Parking
];

export interface SubNavItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

/** Section navigation shown inside each module. */
export const MODULE_SUBNAV: Record<string, SubNavItem[]> = {
  academics: [
    { label: 'Overview', href: '/academics', icon: <LayoutDashboard className="size-4" /> },
    { label: 'Timetable', href: '/academics/timetable', icon: <CalendarDays className="size-4" /> },
    { label: 'Attendance', href: '/academics/attendance', icon: <Users className="size-4" /> },
    { label: 'Assignments', href: '/academics/assignments', icon: <ClipboardList className="size-4" /> },
    { label: 'Examinations', href: '/academics/exams', icon: <FileText className="size-4" /> },
    { label: 'Notices', href: '/academics/notices', icon: <Bell className="size-4" /> },
    { label: 'Documents', href: '/academics/library', icon: <Library className="size-4" /> },
    { label: 'Directory', href: '/academics/directory', icon: <Users className="size-4" /> },
  ],
  books: [
    { label: 'Discover', href: '/books', icon: <BookOpen className="size-4" /> },
    { label: 'My listings', href: '/books/my-listings', icon: <Bookmark className="size-4" /> },
    { label: 'Sell or lend', href: '/books/new', icon: <FileText className="size-4" /> },
  ],
  opportunities: [
    { label: 'Discover', href: '/opportunities', icon: <Compass className="size-4" /> },
    { label: 'Application tracker', href: '/opportunities/tracker', icon: <ClipboardList className="size-4" /> },
  ],
  parking: [
    { label: 'Availability', href: '/parking', icon: <MapPin className="size-4" /> },
    { label: 'My reservations', href: '/parking/bookings', icon: <CircleParking className="size-4" /> },
  ],
};

export interface Breadcrumb {
  label: string;
  href?: string;
}

/** Explicit breadcrumbs for routes whose titles cannot be derived from the path. */
export const ROUTE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/academics': 'Academic Hub',
  '/academics/timetable': 'Timetable',
  '/academics/attendance': 'Attendance',
  '/academics/assignments': 'Assignments',
  '/academics/exams': 'Examinations',
  '/academics/notices': 'Notices',
  '/academics/library': 'Document library',
  '/academics/directory': 'Faculty directory',
  '/academics/courses': 'Courses',
  '/books': 'Books & Resources',
  '/books/new': 'Create a listing',
  '/books/my-listings': 'My listings',
  '/opportunities': 'Travel & Work',
  '/opportunities/tracker': 'Application tracker',
  '/parking': 'Campus Parking',
  '/parking/bookings': 'My reservations',
  '/messages': 'Messages',
  '/saved': 'Saved items',
  '/notifications': 'Notifications',
  '/settings': 'Profile & Settings',
};
