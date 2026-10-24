import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { AuthSurface } from '@/features/auth/AuthSurface';
import { useAuth } from '@/store/AuthProvider';
import { Field, TextInput } from '@/components/ui/fields';
import { Button, InlineNote } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

const REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { id: 'letter', label: 'One letter', test: (value: string) => /[a-zA-Z]/.test(value) },
  { id: 'number', label: 'One number', test: (value: string) => /\d/.test(value) },
] as const;

export default function SignUpPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const checks = useMemo(
    () => REQUIREMENTS.map((requirement) => ({ ...requirement, passed: requirement.test(password) })),
    [password],
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = signUp({ name, email, password });
    if (!result.ok) {
      setError(result.error ?? 'Could not create the account.');
      return;
    }
    setError(null);
    toast.success('Account created', 'Now let us set up your campus profile.');
    navigate('/onboarding', { replace: true });
  }

  return (
    <AuthSurface
      aside={
        <p className="text-center text-xs text-fg-subtle">
          We ask for nothing beyond a name and an email. Programme, semester and interests are optional and can be
          changed at any time.
        </p>
      }
    >
      <div>
        <p className="caps">Get started</p>
        <h1 className="display mt-3 text-[1.875rem] leading-tight text-fg">Create your CampusOS account</h1>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-fg-muted">
          New accounts start genuinely empty, so you can see exactly what the product looks like before you add
          anything.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <Field label="Full name" htmlFor="signup-name" required>
          <TextInput
            id="signup-name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Aarav Mehta"
          />
        </Field>
        <Field label="Email address" htmlFor="signup-email" hint="Any address works here — nothing is verified." required>
          <TextInput
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@campus.edu"
          />
        </Field>
        <Field label="Password" htmlFor="signup-password" required>
          <TextInput
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {checks.map((check) => (
            <li key={check.id} className="flex items-center gap-1.5 text-[0.6875rem]">
              {check.passed ? (
                <Check className="size-3.5 text-ok" aria-hidden="true" />
              ) : (
                <X className="size-3.5 text-fg-subtle" aria-hidden="true" />
              )}
              <span className={cn(check.passed ? 'text-fg-muted' : 'text-fg-subtle')}>{check.label}</span>
            </li>
          ))}
        </ul>

        {error ? (
          <InlineNote tone="danger" title="Could not create the account">
            {error}
          </InlineNote>
        ) : null}

        <Button type="submit" variant="primary" size="lg" fullWidth trailingIcon={<ArrowRight className="size-4" />}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-fg-subtle">
        Already have an account?{' '}
        <Link to="/signin" className="font-medium text-accent hover:text-accent-hover">
          Sign in
        </Link>
      </p>
    </AuthSurface>
  );
}
