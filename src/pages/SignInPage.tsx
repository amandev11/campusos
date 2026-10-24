import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { AuthSurface } from '@/features/auth/AuthSurface';
import { useAuth, DEMO_PASSWORD } from '@/store/AuthProvider';
import { ACCOUNT_SEEDS } from '@/data/community';
import { Field, TextInput } from '@/components/ui/fields';
import { Badge, Button, InlineNote } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/Toast';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { signIn, signInAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = signIn(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? 'Could not sign in.');
      return;
    }
    setError(null);
    toast.success('Signed in', 'Demonstration account loaded.');
    navigate(result.needsOnboarding ? '/onboarding' : from, { replace: true });
  }

  function quickSignIn(role: 'student' | 'faculty' | 'admin') {
    const result = signInAs(role);
    if (!result.ok) {
      setError(result.error ?? 'Demonstration account unavailable.');
      return;
    }
    toast.success('Signed in', `Viewing CampusOS as the ${role} account.`);
    navigate('/', { replace: true });
  }

  return (
    <AuthSurface
      aside={
        <p className="text-center text-xs text-fg-subtle">
          Accounts live in this browser only. Passwords are reduced to a short digest and never stored verbatim, but
          this is a demonstration sign-in — not a security boundary.
        </p>
      }
    >
      <div>
        <p className="caps">Welcome back</p>
        <h1 className="display mt-3 text-[1.875rem] leading-tight text-fg">Sign in to CampusOS</h1>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-fg-muted">
          Your timetable, saved books, applications and reservations are waiting exactly where you left them.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <Field label="Email address" htmlFor="signin-email" required>
          <TextInput
            id="signin-email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            invalid={Boolean(error)}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@campus.edu"
          />
        </Field>
        <Field label="Password" htmlFor="signin-password" required hint={`Demonstration password: ${DEMO_PASSWORD}`}>
          <TextInput
            id="signin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            invalid={Boolean(error)}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {error ? (
          <InlineNote tone="danger" title="Could not sign in">
            {error}
          </InlineNote>
        ) : null}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={pending} trailingIcon={<ArrowRight className="size-4" />}>
          Sign in
        </Button>
      </form>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-3">
          <span className="hairline flex-1" />
          <span className="caps">Or explore as</span>
          <span className="hairline flex-1" />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {(['student', 'faculty', 'admin'] as const).map((role) => {
            const account = ACCOUNT_SEEDS.find((entry) => entry.role === role)!;
            const Icon = role === 'student' ? GraduationCap : role === 'faculty' ? Users : ShieldCheck;
            return (
              <button
                key={role}
                type="button"
                onClick={() => quickSignIn(role)}
                className="flex flex-col items-start gap-2 rounded-xl border border-line bg-surface/45 p-3 text-left transition-all duration-200 hover:border-line-strong hover:bg-surface/70"
              >
                <Icon className="size-4 text-accent" aria-hidden="true" />
                <span className="text-[0.8125rem] font-medium capitalize text-fg">{role}</span>
                <span className="text-[0.6875rem] leading-snug text-fg-subtle">{account.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-fg-subtle">
        No account yet?{' '}
        <Link to="/signup" className="font-medium text-accent hover:text-accent-hover">
          Create one
        </Link>
      </p>
      <p className="mt-4 text-center">
        <Badge tone="muted">Demonstration build · nothing is sent to a server</Badge>
      </p>
    </AuthSurface>
  );
}
