import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { AppProvider } from '@/store/AppProvider';
import { useAuth } from '@/store/AuthProvider';
import { Skeleton } from '@/components/ui/primitives';
import { Wordmark } from '@/components/brand/Logo';

/* ------------------------------------------------------------------ pages */

const OverviewPage = lazy(() => import('@/pages/OverviewPage'));
const SignInPage = lazy(() => import('@/pages/SignInPage'));
const SignUpPage = lazy(() => import('@/pages/SignUpPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const SavedPage = lazy(() => import('@/pages/SavedPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const BooksDiscoverPage = lazy(() => import('@/features/books/BooksDiscoverPage'));
const BookDetailPage = lazy(() => import('@/features/books/BookDetailPage'));
const ListingFormPage = lazy(() => import('@/features/books/ListingFormPage'));
const MyListingsPage = lazy(() => import('@/features/books/MyListingsPage'));

const OpportunitiesPage = lazy(() => import('@/features/opportunities/OpportunitiesPage'));
const OpportunityDetailPage = lazy(() => import('@/features/opportunities/OpportunityDetailPage'));
const TrackerPage = lazy(() => import('@/features/opportunities/TrackerPage'));

const AcademicHubPage = lazy(() => import('@/features/academics/AcademicHubPage'));
const TimetablePage = lazy(() => import('@/features/academics/TimetablePage'));
const AttendancePage = lazy(() => import('@/features/academics/AttendancePage'));
const AssignmentsPage = lazy(() => import('@/features/academics/AssignmentsPage'));
const AssignmentDetailPage = lazy(() => import('@/features/academics/AssignmentDetailPage'));
const ExamsPage = lazy(() => import('@/features/academics/ExamsPage'));
const NoticesPage = lazy(() => import('@/features/academics/NoticesPage'));
const NoticeDetailPage = lazy(() => import('@/features/academics/NoticeDetailPage'));
const LibraryPage = lazy(() => import('@/features/academics/LibraryPage'));
const DocumentPage = lazy(() => import('@/features/academics/DocumentPage'));
const DirectoryPage = lazy(() => import('@/features/academics/DirectoryPage'));
const CoursePage = lazy(() => import('@/features/academics/CoursePage'));
const ManagePage = lazy(() => import('@/features/academics/ManagePage'));

const ParkingPage = lazy(() => import('@/features/parking/ParkingPage'));
const ParkingLotPage = lazy(() => import('@/features/parking/ParkingLotPage'));
const BookingsPage = lazy(() => import('@/features/parking/BookingsPage'));

/* ------------------------------------------------------------------ states */

function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-[104rem] px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-2/3 max-w-lg" />
        <Skeleton className="h-4 w-1/2 max-w-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <Skeleton key={key} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function BootScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Wordmark size="lg" />
        <p className="text-xs text-fg-subtle">Preparing your campus…</p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { profile, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <BootScreen />;
  if (!profile) return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { profile, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (profile) return <Navigate to={profile.onboarded ? '/' : '/onboarding'} replace />;
  return <>{children}</>;
}

/** Wraps the authenticated tree in the data store and enforces onboarding. */
function AuthedWorkspace() {
  const { profile } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Nothing to persist here yet — the store handles its own debounce.
  }, [location.pathname]);

  if (!profile) return null;

  return (
    <AppProvider>
      {!profile.onboarded && location.pathname !== '/onboarding' ? (
        <Navigate to="/onboarding" replace />
      ) : profile.onboarded && location.pathname === '/onboarding' ? (
        <Navigate to="/" replace />
      ) : (
        <Outlet />
      )}
    </AppProvider>
  );
}

/* ------------------------------------------------------------------ routes */

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/signin"
          element={
            <PublicOnly>
              <SignInPage />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <SignUpPage />
            </PublicOnly>
          }
        />

        <Route element={<RequireAuth>{<AuthedWorkspace />}</RequireAuth>}>
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="search" element={<SearchPage />} />

            <Route path="academics" element={<AcademicHubPage />} />
            <Route path="academics/timetable" element={<TimetablePage />} />
            <Route path="academics/attendance" element={<AttendancePage />} />
            <Route path="academics/assignments" element={<AssignmentsPage />} />
            <Route path="academics/assignments/:assignmentId" element={<AssignmentDetailPage />} />
            <Route path="academics/exams" element={<ExamsPage />} />
            <Route path="academics/notices" element={<NoticesPage />} />
            <Route path="academics/notices/:noticeId" element={<NoticeDetailPage />} />
            <Route path="academics/library" element={<LibraryPage />} />
            <Route path="academics/library/:documentId" element={<DocumentPage />} />
            <Route path="academics/directory" element={<DirectoryPage />} />
            <Route path="academics/courses/:courseCode" element={<CoursePage />} />
            <Route path="academics/manage/:kind" element={<ManagePage />} />

            <Route path="books" element={<BooksDiscoverPage />} />
            <Route path="books/new" element={<ListingFormPage />} />
            <Route path="books/my-listings" element={<MyListingsPage />} />
            <Route path="books/:bookId" element={<BookDetailPage />} />
            <Route path="books/:bookId/edit" element={<ListingFormPage />} />

            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="opportunities/tracker" element={<TrackerPage />} />
            <Route path="opportunities/:opportunityId" element={<OpportunityDetailPage />} />

            <Route path="parking" element={<ParkingPage />} />
            <Route path="parking/bookings" element={<BookingsPage />} />
            <Route path="parking/:lotId" element={<ParkingLotPage />} />

            <Route path="messages" element={<MessagesPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
