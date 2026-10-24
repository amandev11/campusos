import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Cable,
  Check,
  Database,
  LogOut,
  Moon,
  RotateCcw,
  Save,
  ShieldCheck,
  Sun,
  Trash,
  UserRound,
} from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { useAuth } from '@/store/AuthProvider';
import { useTheme } from '@/store/ThemeProvider';
import { INTEGRATIONS } from '@/lib/backend';
import { clearAll, isPersistent } from '@/lib/storage';
import { COURSES } from '@/data/academics';
import { ELIGIBILITY_LABELS } from '@/data/parking';
import { formatDate, formatBytes } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Badge,
  Button,
  Divider,
  EmptyState,
  InlineNote,
  Panel,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { Avatar } from '@/components/ui/primitives';
import { Checkbox, Field, OptionCards, Select, Switch, TextInput } from '@/components/ui/fields';
import { ConfirmDialog, Tabs } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/Toast';
import { ModuleHero } from '@/features/shared';
import type { ParkingEligibility } from '@/lib/types';

const INTEREST_OPTIONS = [
  'Algorithms',
  'Design',
  'Travel work',
  'Sustainability',
  'Research',
  'Entrepreneurship',
  'Teaching',
  'Data',
  'Literature',
  'Finance',
];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, toggleSection, moveSection, resetState } = useApp();
  const { profile, accounts, updateProfile, signOut, signInAs } = useAuth();
  const { theme, setTheme } = useTheme();

  const tab = (params.get('tab') ?? 'profile') as 'profile' | 'preferences' | 'integrations' | 'data';

  const [name, setName] = useState(profile?.name ?? '');
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [programme, setProgramme] = useState(profile?.programme ?? '');
  const [department, setDepartment] = useState(profile?.department ?? '');
  const [semester, setSemester] = useState(String(profile?.semester ?? 0));
  const [vehicle, setVehicle] = useState(profile?.vehicleLabel ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [parkingEligibility, setParkingEligibility] = useState<ParkingEligibility>(
    profile?.parkingEligibility ?? 'student',
  );
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const savedBytes = new Blob([JSON.stringify(state)]).size;

  function saveProfile() {
    if (name.trim().length < 2) {
      setError('Add your name.');
      return;
    }
    updateProfile({
      name: name.trim(),
      university: university.trim(),
      programme: programme.trim(),
      department: department.trim(),
      semester: Number(semester) || 0,
      vehicleLabel: vehicle.trim(),
      bio: bio.trim(),
      parkingEligibility,
      interests,
    });
    setError(null);
    toast.success('Profile saved', 'Changes apply across every module immediately.');
  }

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Profile & settings"
        title={profile?.name ?? 'Your account'}
        description="Your account, how CampusOS behaves, which integrations are connected, and what is stored on this device."
        meta={
          <>
            <Badge tone="accent">{profile?.role}</Badge>
            <Badge tone="muted">{profile?.department || 'Department not set'}</Badge>
            <Badge tone={isPersistent() ? 'ok' : 'warn'}>
              {isPersistent() ? 'Stored locally' : 'Memory only'}
            </Badge>
          </>
        }
        aside={
          <div className="flex items-center gap-4">
            <Avatar name={profile?.name ?? 'Unknown'} seed={profile?.avatarSeed} size="xl" />
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-medium text-fg">{profile?.name}</p>
              <p className="truncate text-xs text-fg-muted">{profile?.email}</p>
              <p className="mt-1 text-[0.6875rem] text-fg-subtle">
                Member since {profile ? formatDate(profile.joinedAt, 'medium') : '—'}
              </p>
            </div>
          </div>
        }
      />

      <Tabs
        ariaLabel="Settings sections"
        variant="scroll"
        value={tab}
        onChange={(value) => setParams({ tab: value })}
        tabs={[
          { value: 'profile', label: 'Profile' },
          { value: 'preferences', label: 'Preferences' },
          { value: 'integrations', label: 'Integrations' },
          { value: 'data', label: 'Data & privacy' },
        ]}
      />

      {tab === 'profile' ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <Panel>
            <SectionHeader
              eyebrow="Profile"
              title="Who you are here"
              description="These details shape course matching, book recommendations and parking eligibility."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={error} className="sm:col-span-2">
                <TextInput value={name} onChange={(event) => setName(event.target.value)} invalid={Boolean(error)} />
              </Field>
              <Field label="Email address" hint="Demonstration accounts cannot change their address.">
                <TextInput value={profile?.email ?? ''} readOnly disabled />
              </Field>
              <Field label="Account role" hint="Roles are fixed per demonstration account.">
                <TextInput value={profile?.role ?? ''} readOnly disabled className="capitalize" />
              </Field>
              <Field label="Institution">
                <TextInput
                  value={university}
                  onChange={(event) => setUniversity(event.target.value)}
                  placeholder="Meridian Institute of Technology"
                />
              </Field>
              <Field label="Programme">
                <TextInput
                  value={programme}
                  onChange={(event) => setProgramme(event.target.value)}
                  placeholder="B.Tech Computer Science"
                />
              </Field>
              <Field label="Department">
                <TextInput value={department} onChange={(event) => setDepartment(event.target.value)} />
              </Field>
              <Field label="Semester">
                <Select value={semester} onChange={(event) => setSemester(event.target.value)}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <option key={value} value={value}>
                      {value === 0 ? 'Not applicable' : `Semester ${value}`}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Vehicle registration" hint="Shown on parking reservations.">
                <TextInput
                  value={vehicle}
                  onChange={(event) => setVehicle(event.target.value)}
                  placeholder="DL 8C AB 4412"
                />
              </Field>
              <Field label="Short bio" className="sm:col-span-2">
                <TextInput
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Fifth-semester CS student, mostly found in the design studio."
                />
              </Field>
            </div>

            <Divider />

            <Field label="Parking permit type" hint="Determines which campus areas you may reserve.">
              <OptionCards
                name="Parking eligibility"
                columns={2}
                value={parkingEligibility}
                onChange={setParkingEligibility}
                options={(Object.keys(ELIGIBILITY_LABELS) as ParkingEligibility[]).map((entry) => ({
                  value: entry,
                  label: ELIGIBILITY_LABELS[entry],
                }))}
              />
            </Field>

            <Divider />

            <Field label="Interests" hint="Used for rule-based matching in Travel & Work and Books.">
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setInterests((current) =>
                          current.includes(interest)
                            ? current.filter((entry) => entry !== interest)
                            : [...current, interest],
                        )
                      }
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                        selected
                          ? 'border-accent/50 bg-accent-soft text-accent'
                          : 'border-line bg-surface/50 text-fg-muted hover:border-line-strong hover:text-fg',
                      )}
                    >
                      {selected ? <Check className="size-3" aria-hidden="true" /> : null}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </Field>

            {error ? (
              <InlineNote tone="danger" className="mt-5" title="Not saved">
                {error}
              </InlineNote>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button variant="primary" icon={<Save className="size-4" />} onClick={saveProfile}>
                Save profile
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setName(profile?.name ?? '');
                  setUniversity(profile?.university ?? '');
                  setProgramme(profile?.programme ?? '');
                  setDepartment(profile?.department ?? '');
                  setVehicle(profile?.vehicleLabel ?? '');
                  setBio(profile?.bio ?? '');
                  setError(null);
                }}
              >
                Discard changes
              </Button>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel>
              <SectionHeader eyebrow="Account" title="Demonstration details" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatTile label="Courses" value={COURSES.length} hint="Registered this term" />
                <StatTile label="Saved items" value={state.saved.length} hint="Across modules" />
                <StatTile label="Applications" value={Object.keys(state.applications).length} hint="Tracked roles" />
                <StatTile label="Reservations" value={state.reservations.length} hint="Parking bookings" />
              </div>
            </Panel>

            <Panel>
              <SectionHeader eyebrow="Switch account" title="View CampusOS as another role" />
              <ul className="mt-4 space-y-2">
                {accounts.map((account) => (
                  <li key={account.id}>
                    <button
                      type="button"
                      disabled={account.id === profile?.id}
                      onClick={() => {
                        const result = signInAs(account.role);
                        if (!result.ok) {
                          toast.error('Could not switch account', result.error);
                          return;
                        }
                        toast.success('Signed in', `Now viewing CampusOS as ${account.name}.`);
                        navigate('/');
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                        account.id === profile?.id
                          ? 'border-accent/45 bg-accent-soft'
                          : 'border-line hover:border-line-strong hover:bg-surface/60',
                        account.id !== profile?.id && 'cursor-pointer',
                      )}
                    >
                      <Avatar name={account.name} seed={account.avatarSeed} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem] text-fg">{account.name}</span>
                        <span className="block truncate text-[0.6875rem] text-fg-subtle capitalize">{account.role}</span>
                      </span>
                      {account.id === profile?.id ? (
                        <Badge tone="accent">Signed in</Badge>
                      ) : (
                        <span className="text-[0.6875rem] text-accent">Switch</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.6875rem] text-fg-subtle">
                Use the account menu in the top bar to switch roles. Each account keeps its own saved items, listings and
                reservations.
              </p>
            </Panel>

            <Panel strength="quiet">
              <Button
                variant="danger"
                fullWidth
                icon={<LogOut className="size-4" />}
                onClick={() => {
                  signOut();
                  navigate('/signin');
                }}
              >
                Sign out
              </Button>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'preferences' ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel>
            <SectionHeader
              eyebrow="Appearance"
              title="Theme"
              description="Dark is the default. Both themes are designed rather than inverted, and your choice persists."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(['dark', 'light'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={theme === option}
                  onClick={() => setTheme(option)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors',
                    theme === option ? 'border-accent/50 bg-accent-soft' : 'border-line hover:border-line-strong',
                  )}
                >
                  {option === 'dark' ? (
                    <Moon className="size-4 text-accent" aria-hidden="true" />
                  ) : (
                    <Sun className="size-4 text-accent" aria-hidden="true" />
                  )}
                  <span>
                    <span className="block text-[0.8125rem] font-medium capitalize text-fg">{option}</span>
                    <span className="mt-0.5 block text-[0.6875rem] text-fg-subtle">
                      {option === 'dark' ? 'Warm illumination on midnight navy' : 'Ivory surfaces, softer shadows'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeader
              eyebrow="Dashboard"
              title="Overview sections"
              description="Choose what appears on your overview and in what order."
            />
            <ul className="mt-5 space-y-2">
              {state.prefs.map((section, index) => (
                <li key={section.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface/45 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] text-fg">{section.label}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-fg-subtle">{section.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${section.label} up`}
                      className="rounded-md border border-line px-1.5 py-1 text-[0.625rem] text-fg-subtle transition-colors hover:text-fg disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, 1)}
                      disabled={index === state.prefs.length - 1}
                      aria-label={`Move ${section.label} down`}
                      className="rounded-md border border-line px-1.5 py-1 text-[0.625rem] text-fg-subtle transition-colors hover:text-fg disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <Switch
                      checked={section.visible}
                      onChange={() => toggleSection(section.id)}
                      label={<span className="sr-only">{section.visible ? 'Hide' : 'Show'} {section.label}</span>}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="lg:col-span-2">
            <SectionHeader
              eyebrow="Accessibility"
              title="Motion and density"
              description="CampusOS respects your system settings for reduced motion and reduced transparency."
            />
            <div className="mt-5 space-y-4">
              <Switch
                checked
                onChange={() => undefined}
                disabled
                label="Follow system reduced-motion preference"
                hint="Animation is disabled automatically when your system asks for it. This cannot be turned off."
              />
              <Switch
                checked
                onChange={() => undefined}
                disabled
                label="Respect contrast and readability over translucency"
                hint="Glass surfaces never drop below AA contrast. Light theme uses opaque panels where legibility requires it."
              />
              <Checkbox
                checked
                onChange={() => undefined}
                disabled
                label="Announce status messages to screen readers"
                hint="Toasts and inline confirmations are announced through a live region."
              />
            </div>
          </Panel>
        </div>
      ) : null}

      {tab === 'integrations' ? (
        <div className="space-y-5">
          <InlineNote tone="warn" title="Nothing is connected yet">
            CampusOS runs entirely on demonstration data in this browser. Below is exactly what each integration would
            unlock and which environment variables it needs. Secrets belong on the server, never in front-end code.
          </InlineNote>

          <div className="grid gap-4 lg:grid-cols-2">
            {INTEGRATIONS.map((integration) => (
              <Panel key={integration.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[0.9375rem] font-medium text-fg">
                      <Cable className="size-4 text-fg-subtle" aria-hidden="true" />
                      {integration.name}
                    </p>
                    <p className="mt-1 text-xs text-fg-muted">{integration.purpose}</p>
                  </div>
                  <Badge tone={integration.configured ? 'ok' : 'warn'}>
                    {integration.configured ? 'Connected' : 'Not connected'}
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="caps">While unconfigured</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{integration.fallback}</p>
                  </div>
                  <div>
                    <p className="caps">Unlocks</p>
                    <ul className="mt-1.5 space-y-1.5">
                      {integration.unlocks.map((unlock) => (
                        <li key={unlock} className="flex gap-2 text-xs text-fg-muted">
                          <Check className="mt-0.5 size-3 shrink-0 text-teal" aria-hidden="true" />
                          {unlock}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="caps">Environment variables</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {integration.envVars.map((variable) => (
                        <li key={variable}>
                          <Badge tone="muted" className="numeric">
                            {variable}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          <Panel strength="quiet">
            <SectionHeader
              eyebrow="Security notes"
              title="How credentials are handled"
              description="A short statement of the security posture of this build."
            />
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-fg-muted">
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-teal" aria-hidden="true" />
                No service-role key, private key or API secret exists in this front end. There is nothing to leak
                because nothing is configured.
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-teal" aria-hidden="true" />
                Demonstration passwords are reduced to a digest before storage so credentials are never kept verbatim —
                but this is not a security boundary.
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-teal" aria-hidden="true" />
                Uploads are validated for type and size in the browser. Real enforcement requires server-side
                validation, which arrives with the storage integration.
              </li>
            </ul>
          </Panel>
        </div>
      ) : null}

      {tab === 'data' ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel>
            <SectionHeader
              eyebrow="What is stored"
              title="Everything lives in this browser"
              description="CampusOS has no server in this build, so there is nothing to sync and nothing sent anywhere."
            />
            <ul className="mt-5 space-y-2.5 text-xs leading-relaxed text-fg-muted">
              <li className="flex justify-between gap-3 border-b border-line pb-2.5">
                <span>Account profile and demonstration credentials</span>
                <span className="numeric text-fg">{accounts.length} accounts</span>
              </li>
              <li className="flex justify-between gap-3 border-b border-line pb-2.5">
                <span>Saved items, notifications, activity</span>
                <span className="numeric text-fg">{state.saved.length + state.notifications.length + state.activity.length}</span>
              </li>
              <li className="flex justify-between gap-3 border-b border-line pb-2.5">
                <span>Listings, applications, reservations, submissions</span>
                <span className="numeric text-fg">
                  {state.listings.length + Object.keys(state.applications).length + state.reservations.length + Object.keys(state.submissions).length}
                </span>
              </li>
              <li className="flex justify-between gap-3 border-b border-line pb-2.5">
                <span>Messages and reports</span>
                <span className="numeric text-fg">
                  {state.threads.length + state.reports.length}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Approximate size on device</span>
                <span className="numeric text-fg">{formatBytes(savedBytes / 1024)}</span>
              </li>
            </ul>
            <p className="mt-4 text-[0.6875rem] text-fg-subtle">
              {isPersistent()
                ? 'Storage is available, so your work survives a reload on this device.'
                : 'Local storage is unavailable, so data is held in memory and lost on reload.'}
            </p>
          </Panel>

          <div className="space-y-5">
            <Panel>
              <SectionHeader
                eyebrow="Reset"
                title="Restore the demonstration state"
                description="Clears the records created in your account and restores the sample data."
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="danger" icon={<RotateCcw className="size-4" />} onClick={() => setConfirmReset(true)}>
                  Reset my demo data
                </Button>
                <Button
                  variant="quiet"
                  icon={<Trash className="size-4" />}
                  onClick={() => {
                    clearAll();
                    toast.success('Local storage cleared', 'Signed out and every stored record removed.');
                    signOut();
                    navigate('/signin');
                  }}
                >
                  Clear everything on this device
                </Button>
              </div>
              <InlineNote tone="warn" className="mt-4" title="This cannot be undone">
                Clearing storage removes every account, listing, application and reservation held by CampusOS on this
                device. Other applications are not affected.
              </InlineNote>
            </Panel>

            <Panel strength="quiet">
              <SectionHeader eyebrow="Privacy" title="What CampusOS does not do" />
              <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-fg-muted">
                <li>No analytics, tracking pixels or third-party scripts are loaded.</li>
                <li>No academic records, marks or attendance figures are transmitted anywhere.</li>
                <li>No private messaging groups or external chat platforms are read.</li>
                <li>No personal contact details are published on listings by default.</li>
              </ul>
            </Panel>

            {state.reports.length > 0 ? (
              <Panel>
                <SectionHeader
                  eyebrow="Your reports"
                  title={`${state.reports.length} submitted`}
                  description="Reports are stored locally in this build."
                />
                <ul className="mt-4 space-y-2">
                  {state.reports.map((report) => (
                    <li key={report.id} className="rounded-xl border border-line bg-surface/45 p-3">
                      <p className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-fg">
                        {report.refLabel}
                        <Badge tone="muted">{report.status}</Badge>
                      </p>
                      <p className="mt-1 text-[0.6875rem] text-fg-subtle">
                        {report.reason} · {formatDate(report.createdAt, 'short')}
                      </p>
                      <p className="mt-1.5 text-xs text-fg-muted">{report.detail}</p>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : (
              <Panel strength="quiet">
                <EmptyState
                  icon={<Database className="size-5" aria-hidden="true" />}
                  title="No reports filed"
                  description="If you report a listing or opportunity, it will appear here with its moderation state."
                  className="border-none py-6"
                />
              </Panel>
            )}
          </div>
        </div>
      ) : null}

      <Panel strength="quiet">
        <p className="flex flex-wrap items-center gap-3 text-xs text-fg-subtle">
          <span className="flex items-center gap-1.5">
            <UserRound className="size-3.5" aria-hidden="true" />
            Signed in as {profile?.email}
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="size-3.5" aria-hidden="true" />
            {INTEGRATIONS.filter((entry) => !entry.configured).length} integrations unconfigured
          </span>
        </p>
      </Panel>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetState();
          toast.success('Demonstration data restored', 'Your account is back to its initial sample state.');
          setConfirmReset(false);
        }}
        title="Reset your demonstration data?"
        description="Your listings, applications, reservations, submissions and saved items will be replaced with the original sample set."
        confirmLabel="Reset data"
        destructive
      />
    </div>
  );
}
