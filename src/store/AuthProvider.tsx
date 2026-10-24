import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ACCOUNT_SEEDS, DEMO_PASSWORD, makeFreshProfile, type AccountSeed } from '@/data/community';
import { makeId, stableHash } from '@/lib/ids';
import { readKey, writeKey } from '@/lib/storage';
import type { Account, Profile, Role, Session } from '@/lib/types';

/**
 * Demonstration authentication.
 *
 * Accounts live in this browser only. Passwords are reduced to a short digest
 * so that credentials are never stored verbatim, but this is not a security
 * boundary: any real deployment replaces it with a server-side provider, which
 * `integrationById('supabase')` reports as unconfigured.
 */

function digest(password: string, salt: string): string {
  let value = stableHash(`${salt}:${password}`);
  for (let i = 0; i < 3; i += 1) value = stableHash(`${value}:${salt}:${i}`);
  return value.toString(36);
}

function toAccount(seed: AccountSeed): Account {
  const { password, ...profile } = seed;
  return { ...profile, passwordDigest: digest(password, seed.id) };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface AuthResult {
  ok: boolean;
  error?: string;
  needsOnboarding?: boolean;
}

interface AuthContextValue {
  accounts: Account[];
  session: Session | null;
  profile: Profile | null;
  ready: boolean;
  signIn: (email: string, password: string) => AuthResult;
  signUp: (input: { name: string; email: string; password: string }) => AuthResult;
  signInAs: (role: Role) => AuthResult;
  signOut: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
  resetDemoAccounts: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadAccounts(): Account[] {
  const stored = readKey<Account[] | null>('accounts', null);
  if (stored && stored.length > 0) return stored;
  const seeded = ACCOUNT_SEEDS.map(toAccount);
  writeKey('accounts', seeded);
  return seeded;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(loadAccounts);
  const [session, setSession] = useState<Session | null>(() => readKey<Session | null>('session', null));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    writeKey('accounts', accounts);
  }, [accounts]);

  useEffect(() => {
    if (session) writeKey('session', session);
    else writeKey('session', null);
    setReady(true);
  }, [session]);

  const profile = useMemo(
    () => (session ? (accounts.find((account) => account.id === session.userId) ?? null) : null),
    [accounts, session],
  );

  const signIn = useCallback<AuthContextValue['signIn']>(
    (email, password) => {
      const normalised = email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalised)) return { ok: false, error: 'Enter a valid email address.' };
      const account = accounts.find((entry) => entry.email.toLowerCase() === normalised);
      if (!account) return { ok: false, error: 'No account found for that email address.' };
      if (account.passwordDigest !== digest(password, account.id)) {
        return { ok: false, error: 'That password does not match. Demo accounts use “campusos”.' };
      }
      setSession({ userId: account.id, startedAt: new Date().toISOString() });
      return { ok: true, needsOnboarding: !account.onboarded };
    },
    [accounts],
  );

  const signUp = useCallback<AuthContextValue['signUp']>(
    ({ name, email, password }) => {
      const normalised = email.trim().toLowerCase();
      const trimmedName = name.trim();
      if (trimmedName.length < 2) return { ok: false, error: 'Enter your full name.' };
      if (!EMAIL_PATTERN.test(normalised)) return { ok: false, error: 'Enter a valid email address.' };
      if (password.length < 8) return { ok: false, error: 'Use at least 8 characters for the password.' };
      if (accounts.some((entry) => entry.email.toLowerCase() === normalised)) {
        return { ok: false, error: 'An account already exists for that email address.' };
      }
      const id = makeId('usr');
      const fresh = makeFreshProfile(id, trimmedName, normalised);
      const account: Account = { ...fresh, passwordDigest: digest(password, id) };
      setAccounts((current) => [...current, account]);
      setSession({ userId: id, startedAt: new Date().toISOString() });
      return { ok: true, needsOnboarding: true };
    },
    [accounts],
  );

  const signInAs = useCallback<AuthContextValue['signInAs']>(
    (role) => {
      const account = accounts.find((entry) => entry.role === role);
      if (!account) return { ok: false, error: `No demonstration account for the ${role} role.` };
      setSession({ userId: account.id, startedAt: new Date().toISOString() });
      return { ok: true, needsOnboarding: false };
    },
    [accounts],
  );

  const signOut = useCallback(() => setSession(null), []);

  const updateProfile = useCallback<AuthContextValue['updateProfile']>(
    (patch) => {
      if (!session) return;
      setAccounts((current) =>
        current.map((account) => (account.id === session.userId ? { ...account, ...patch } : account)),
      );
    },
    [session],
  );

  const resetDemoAccounts = useCallback(() => {
    const seeded = ACCOUNT_SEEDS.map(toAccount);
    setAccounts(seeded);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accounts,
      session,
      profile,
      ready,
      signIn,
      signUp,
      signInAs,
      signOut,
      updateProfile,
      resetDemoAccounts,
    }),
    [accounts, session, profile, ready, signIn, signUp, signInAs, signOut, updateProfile, resetDemoAccounts],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export { DEMO_PASSWORD };
