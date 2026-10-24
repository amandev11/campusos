import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, SkipForward } from 'lucide-react';
import { useAuth } from '@/store/AuthProvider';
import { AuthSurface } from '@/features/auth/AuthSurface';
import { COURSES } from '@/data/academics';
import { BOOK_SUBJECTS } from '@/data/books';
import { ELIGIBILITY_LABELS } from '@/data/parking';
import { cn } from '@/lib/cn';
import { Button, InlineNote, Panel, ProgressSteps } from '@/components/ui/primitives';
import { Checkbox, Field, OptionCards, Select, TextInput } from '@/components/ui/fields';
import { useToast } from '@/components/ui/Toast';
import type { ParkingEligibility, Role } from '@/lib/types';

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

const STEPS = ['You', 'Study', 'Interests', 'Campus'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile, updateProfile } = useAuth();
  const [step, setStep] = useState(0);

  const [name, setName] = useState(profile?.name ?? '');
  const [role, setRole] = useState<Role>(profile?.role ?? 'student');
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [programme, setProgramme] = useState(profile?.programme ?? '');
  const [department, setDepartment] = useState(profile?.department ?? '');
  const [semester, setSemester] = useState(profile?.semester ? String(profile.semester) : '5');
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [parkingEligibility, setParkingEligibility] = useState<ParkingEligibility>(
    profile?.parkingEligibility ?? 'student',
  );
  const [vehicleLabel, setVehicleLabel] = useState(profile?.vehicleLabel ?? '');
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest) ? current.filter((entry) => entry !== interest) : [...current, interest],
    );
  }

  function finish(skipped = false) {
    if (!skipped && name.trim().length < 2) {
      setError('Add your name so the dashboard can greet you properly.');
      setStep(0);
      return;
    }
    updateProfile({
      name: name.trim() || profile?.name || 'New student',
      role,
      university: university.trim(),
      programme: programme.trim(),
      department: department.trim() || (role === 'student' ? 'Not specified' : programme.trim()),
      semester: Number(semester) || 0,
      interests,
      parkingEligibility,
      vehicleLabel: vehicleLabel.trim(),
      onboarded: true,
    });
    toast.success(
      skipped ? 'Profile skipped' : 'Profile saved',
      'You can change every one of these answers later in Settings.',
    );
    navigate('/', { replace: true });
  }

  return (
    <AuthSurface wide>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="caps">First-time setup</p>
          <h1 className="display mt-2 text-[1.75rem] leading-tight text-fg">
            Let us point CampusOS at your campus
          </h1>
          <p className="mt-2 max-w-xl text-[0.8125rem] leading-relaxed text-fg-muted">
            Four short steps, all of them optional. Nothing here is sent anywhere — it only decides which courses,
            listings and opportunities get surfaced first.
          </p>
        </div>
        <ProgressSteps steps={STEPS} current={step} />
      </div>

      <Panel strength="solid" className="p-5 sm:p-6">
        {step === 0 ? (
          <div className="space-y-5">
            <Field label="What should we call you?" htmlFor="onb-name" required error={error}>
              <TextInput
                id="onb-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Aarav Mehta"
                autoFocus
              />
            </Field>
            <Field label="Which experience fits you best?" hint="This decides what the Create menu offers first.">
              <OptionCards
                name="Role"
                columns={3}
                value={role}
                onChange={setRole}
                options={[
                  { value: 'student', label: 'Student', hint: 'Courses, assignments, books, parking' },
                  { value: 'faculty', label: 'Faculty', hint: 'Publish material and grade work' },
                  { value: 'admin', label: 'Administrator', hint: 'Institution-wide notices and access' },
                ]}
              />
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Institution" htmlFor="onb-university" hint="Any name you like — no directory lookup happens.">
                <TextInput
                  id="onb-university"
                  value={university}
                  onChange={(event) => setUniversity(event.target.value)}
                  placeholder="Meridian Institute of Technology"
                />
              </Field>
              <Field label="Programme" htmlFor="onb-programme">
                <TextInput
                  id="onb-programme"
                  value={programme}
                  onChange={(event) => setProgramme(event.target.value)}
                  placeholder="B.Tech Computer Science"
                />
              </Field>
              <Field label="Department" htmlFor="onb-department">
                <TextInput
                  id="onb-department"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  placeholder="Computer Science & Engineering"
                />
              </Field>
              <Field label="Current semester" htmlFor="onb-semester">
                <Select id="onb-semester" value={semester} onChange={(event) => setSemester(event.target.value)}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <option key={value} value={value}>
                      {value === 0 ? 'Not applicable' : `Semester ${value}`}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <InlineNote tone="neutral" title="Which courses appear">
              The Academic Hub ships with a sample Semester 5 curriculum ({COURSES.length} courses). Connect an
              institutional source later and your real registration replaces it.
            </InlineNote>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <Field
              label="What are you interested in?"
              hint="Used for transparent rule-based matching in Travel & Work and Books. Pick as many as you like."
            >
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleInterest(interest)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
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
            {BOOK_SUBJECTS.length > 0 ? (
              <p className="text-xs leading-relaxed text-fg-subtle">
                Book recommendations currently cover {BOOK_SUBJECTS.length} subjects, from {BOOK_SUBJECTS[0]} to{' '}
                {BOOK_SUBJECTS[BOOK_SUBJECTS.length - 1]}.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <Field label="Parking eligibility" hint="Determines which campus areas you are allowed to reserve.">
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
            <Field
              label="Vehicle registration"
              htmlFor="onb-vehicle"
              hint="Optional. Shown on reservations; you can add it later."
            >
              <TextInput
                id="onb-vehicle"
                value={vehicleLabel}
                onChange={(event) => setVehicleLabel(event.target.value)}
                placeholder="DL 8C AB 4412"
              />
            </Field>
            <div className="space-y-3 rounded-xl border border-line bg-surface/50 p-4">
              <Checkbox
                checked
                onChange={() => undefined}
                disabled
                label="Keep academic records in demonstration mode"
                hint="No institutional system is connected, so attendance and marks remain clearly labelled sample data."
              />
            </div>
          </div>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
              icon={<ArrowLeft className="size-4" />}
            >
              Back
            </Button>
            <Button variant="ghost" onClick={() => finish(true)} icon={<SkipForward className="size-4" />}>
              Skip setup
            </Button>
          </div>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={() => setStep((current) => current + 1)} trailingIcon={<ArrowRight className="size-4" />}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={() => finish()} trailingIcon={<Check className="size-4" />}>
              Enter CampusOS
            </Button>
          )}
        </div>
      </Panel>
    </AuthSurface>
  );
}
