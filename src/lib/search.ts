import { BOOKS, CONDITION_LABELS, TRANSACTION_LABELS } from '@/data/books';
import { OPPORTUNITIES, TYPE_LABELS } from '@/data/opportunities';
import {
  ASSIGNMENTS,
  COURSES,
  DOCUMENTS,
  EXAMS,
  FACULTY,
  NOTICES,
  courseByCode,
} from '@/data/academics';
import { PARKING_LOTS, ELIGIBILITY_LABELS } from '@/data/parking';
import { formatDate } from './format';
import type { Book, SearchHit, SearchKind } from './types';

/**
 * A single in-memory index over every module. It is intentionally simple and
 * synchronous: the corpus is small, and correctness of ranking matters more
 * than cleverness. Swap `searchAll` for a server endpoint when a backend exists.
 */

function join(...parts: (string | undefined | null | false)[]): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function hit(
  kind: SearchKind,
  id: string,
  title: string,
  subtitle: string,
  meta: string,
  href: string,
  keywords: string,
  badge?: string,
): SearchHit {
  return { id: `${kind}:${id}`, kind, title, subtitle, meta, href, keywords, badge };
}

function bookKeywords(book: Book): string {
  return join(
    book.title,
    book.author,
    book.subject,
    book.isbn,
    book.edition,
    book.publisher,
    book.courseCodes.join(' '),
    book.tags.join(' '),
    book.seller.name,
    book.location,
    CONDITION_LABELS[book.condition],
    TRANSACTION_LABELS[book.transaction],
  );
}

export function buildIndex(): SearchHit[] {
  const hits: SearchHit[] = [];

  for (const book of BOOKS) {
    hits.push(
      hit(
        'book',
        book.id,
        book.title,
        `${book.author} · ${book.edition}`,
        `${TRANSACTION_LABELS[book.transaction]} · ${book.location}`,
        `/books/${book.id}`,
        bookKeywords(book),
        book.courseCodes[0],
      ),
    );
  }

  for (const opportunity of OPPORTUNITIES) {
    hits.push(
      hit(
        'opportunity',
        opportunity.id,
        opportunity.title,
        `${opportunity.organisation} · ${opportunity.location}`,
        `${TYPE_LABELS[opportunity.type]} · closes ${formatDate(opportunity.deadline, 'short')}`,
        `/opportunities/${opportunity.id}`,
        join(
          opportunity.title,
          opportunity.organisation,
          opportunity.location,
          opportunity.country,
          opportunity.categories.join(' '),
          opportunity.tags.join(' '),
          TYPE_LABELS[opportunity.type],
          opportunity.description,
        ),
        opportunity.verified ? 'Verified' : undefined,
      ),
    );
  }

  for (const notice of NOTICES) {
    hits.push(
      hit(
        'notice',
        notice.id,
        notice.title,
        `${notice.channel} · ${notice.department}`,
        `${notice.category} · ${formatDate(notice.publishedAt, 'short')}`,
        `/academics/notices/${notice.id}`,
        join(notice.title, notice.body, notice.category, notice.channel, notice.department, notice.courseCode),
        notice.importance === 'critical' ? 'Critical' : notice.courseCode ?? undefined,
      ),
    );
  }

  for (const lot of PARKING_LOTS) {
    hits.push(
      hit(
        'parking',
        lot.id,
        lot.name,
        `${lot.code} · ${lot.capacity} spaces`,
        lot.occupancy ? `${lot.occupancy.available} free (simulated)` : 'No live availability',
        `/parking/${lot.id}`,
        join(
          lot.name,
          lot.code,
          lot.zone,
          lot.hours,
          lot.rules.join(' '),
          Object.keys(lot.walkMinutes).join(' '),
          lot.eligibility.map((entry) => ELIGIBILITY_LABELS[entry]).join(' '),
        ),
        lot.requiresReservation ? 'Reservation' : undefined,
      ),
    );
  }

  for (const document of DOCUMENTS) {
    const course = document.courseCode ? courseByCode(document.courseCode) : undefined;
    hits.push(
      hit(
        'document',
        document.id,
        document.title,
        `${document.uploadedBy}${course ? ` · ${course.code}` : ''}`,
        `${document.category.replace('-', ' ')} · ${document.pages} pages`,
        `/academics/library/${document.id}`,
        join(document.title, document.tags.join(' '), document.uploadedBy, document.category, document.courseCode),
        document.restricted ? 'Restricted' : undefined,
      ),
    );
  }

  for (const assignment of ASSIGNMENTS) {
    hits.push(
      hit(
        'assignment',
        assignment.id,
        assignment.title,
        `${assignment.courseCode} · due ${formatDate(assignment.dueAt, 'short')}`,
        `${assignment.maxMarks} marks · ${assignment.state}`,
        `/academics/assignments/${assignment.id}`,
        join(assignment.title, assignment.brief, assignment.courseCode, assignment.createdBy),
        assignment.courseCode,
      ),
    );
  }

  for (const course of COURSES) {
    hits.push(
      hit(
        'course',
        course.code,
        `${course.code} — ${course.title}`,
        course.faculty,
        `${course.credits} credits · ${course.department}`,
        `/academics/courses/${course.code}`,
        join(course.code, course.title, course.faculty, course.department),
        course.code,
      ),
    );
  }

  for (const member of FACULTY) {
    hits.push(
      hit(
        'faculty',
        member.id,
        member.name,
        `${member.title} · ${member.department}`,
        `${member.hours} · ${member.cabin}`,
        `/academics/directory?q=${encodeURIComponent(member.name)}`,
        join(member.name, member.department, member.title, member.researchAreas.join(' '), member.email),
      ),
    );
  }

  for (const exam of EXAMS) {
    hits.push(
      hit(
        'exam',
        exam.id,
        `${exam.courseCode} — ${exam.kind === 'viva' ? 'viva' : exam.kind === 'practical' ? 'practical' : 'written examination'}`,
        `${exam.hall} · ${exam.seatRange}`,
        `${formatDate(exam.date)} at ${exam.start}`,
        '/academics/exams',
        join(exam.courseCode, exam.title, exam.hall, exam.kind),
        exam.courseCode,
      ),
    );
  }

  return hits;
}

export interface SearchResult extends SearchHit {
  score: number;
}

/** Weighted substring matching — prefix hits outrank interior hits. */
function scoreHit(entry: SearchHit, needles: string[]): number {
  const title = entry.title.toLowerCase();
  const subtitle = entry.subtitle.toLowerCase();
  let total = 0;
  for (const needle of needles) {
    let fieldScore = 0;
    if (title === needle) fieldScore += 120;
    else if (title.startsWith(needle)) fieldScore += 70;
    else if (title.includes(needle)) fieldScore += 42;

    if (subtitle.startsWith(needle)) fieldScore += 26;
    else if (subtitle.includes(needle)) fieldScore += 18;

    if (entry.badge && entry.badge.toLowerCase().includes(needle)) fieldScore += 12;
    if (entry.meta.toLowerCase().includes(needle)) fieldScore += 8;
    if (entry.keywords.includes(needle)) fieldScore += 6;

    if (fieldScore === 0) return 0; // every term must appear somewhere
    total += fieldScore;
  }
  return total;
}

export function searchAll(
  query: string,
  index: SearchHit[],
  options: { kinds?: SearchKind[]; limit?: number } = {},
): SearchResult[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return [];
  const needles = trimmed.split(/\s+/).filter((part) => part.length > 0);
  const pool = options.kinds ? index.filter((entry) => options.kinds!.includes(entry.kind)) : index;

  const scored: SearchResult[] = [];
  for (const entry of pool) {
    const score = scoreHit(entry, needles);
    if (score > 0) scored.push({ ...entry, score });
  }
  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return scored.slice(0, options.limit ?? 40);
}

export const SEARCH_KIND_LABELS: Record<SearchKind, string> = {
  book: 'Books',
  opportunity: 'Travel & Work',
  notice: 'Notices',
  parking: 'Parking',
  document: 'Documents',
  assignment: 'Assignments',
  course: 'Courses',
  faculty: 'Faculty',
  exam: 'Examinations',
};

export const SEARCH_KIND_ORDER: SearchKind[] = [
  'book',
  'opportunity',
  'notice',
  'document',
  'assignment',
  'parking',
  'course',
  'faculty',
  'exam',
];

export const SAVED_KIND_TO_SEARCH_KIND: Record<string, SearchKind> = {
  book: 'book',
  opportunity: 'opportunity',
  notice: 'notice',
  parking: 'parking',
  document: 'document',
  assignment: 'assignment',
};
