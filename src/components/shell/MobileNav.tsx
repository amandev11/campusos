import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bookmark, Ellipsis, GraduationCap, LogOut, Moon, Sun } from 'lucide-react';
import { PRIMARY_NAV, MOBILE_TABS } from '@/config/navigation';
import { useApp } from '@/store/AppProvider';
import { useAuth } from '@/store/AuthProvider';
import { useTheme } from '@/store/ThemeProvider';
import { cn } from '@/lib/cn';
import { Avatar, Badge, IconButton } from '@/components/ui/primitives';
import { Sheet } from '@/components/ui/overlays';
import { Wordmark } from '@/components/brand/Logo';

function active(pathname: string, href: string, match?: string[]): boolean {
  if (href === '/') return pathname === '/';
  if (pathname === href) return true;
  return (match ?? [href]).some((prefix) => pathname.startsWith(prefix));
}

export function MobileTabBar({ onOpenMore }: { onOpenMore: () => void }) {
  const { pathname } = useLocation();
  const { unreadNotifications, unreadThreads } = useApp();

  const badgeFor = (key?: string): number => {
    if (key === 'notifications') return unreadNotifications;
    if (key === 'messages') return unreadThreads;
    return 0;
  };

  return (
    <nav
      aria-label="Primary navigation"
      className="glass-surface glass-nav safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line lg:hidden"
    >
      <ul className="flex items-stretch">
        {MOBILE_TABS.map((item) => {
          const isActive = active(pathname, item.href, item.match);
          const badge = badgeFor(item.badgeKey);
          return (
            <li key={item.id} className="flex-1">
              <NavLink
                to={item.href}
                end={item.href === '/'}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[3.5rem] flex-col items-center justify-center gap-1 px-1 py-2 transition-colors',
                  isActive ? 'text-accent' : 'text-fg-subtle',
                )}
              >
                <span className="relative">
                  {item.icon}
                  {badge > 0 ? (
                    <span className="absolute -right-2 -top-1 size-1.5 rounded-full bg-accent" aria-hidden="true" />
                  ) : null}
                </span>
                <span className="max-w-full truncate text-[0.625rem] font-medium tracking-wide">{item.label}</span>
                {isActive ? <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-accent" aria-hidden="true" /> : null}
              </NavLink>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={onOpenMore}
            aria-label="More destinations"
            className="flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-1 px-1 py-2 text-fg-subtle transition-colors hover:text-fg"
          >
            <Ellipsis className="size-[1.125rem]" aria-hidden="true" />
            <span className="text-[0.625rem] font-medium tracking-wide">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, unreadNotifications, unreadThreads } = useApp();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const badgeFor = (key?: string): number => {
    if (key === 'notifications') return unreadNotifications;
    if (key === 'messages') return unreadThreads;
    if (key === 'saved') return state.saved.length;
    return 0;
  };

  return (
    <Sheet open={open} onClose={onClose} title="Navigate" side="left">
      <div className="-mt-2">
        <Wordmark />
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-surface/50 p-3">
          <Avatar name={state.profile.name} seed={state.profile.avatarSeed} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-medium text-fg">{state.profile.name}</p>
            <p className="truncate text-xs text-fg-subtle">
              {state.profile.university || 'Institution not set'}
            </p>
          </div>
          <Badge tone="accent">{state.profile.role}</Badge>
        </div>

        <nav aria-label="All destinations" className="mt-5">
          {PRIMARY_NAV.map((section) => (
            <div key={section.id} className="mb-5">
              <p className="px-1 pb-2 text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">{section.label}</p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = active(location.pathname, item.href, item.match);
                  const badge = badgeFor(item.badgeKey);
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.href}
                        end={item.href === '/'}
                        onClick={onClose}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors',
                          isActive
                            ? 'border-line bg-surface/70 text-fg'
                            : 'border-transparent text-fg-muted hover:bg-surface/50 hover:text-fg',
                        )}
                      >
                        <span className={cn('shrink-0', isActive ? 'text-accent' : 'text-fg-subtle')}>{item.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.8125rem] font-medium">{item.label}</span>
                          <span className="mt-0.5 block truncate text-xs text-fg-subtle">{item.description}</span>
                        </span>
                        {badge > 0 ? (
                          <span className="numeric rounded-full border border-accent/40 bg-accent-soft px-1.5 py-0.5 text-[0.625rem] text-accent">
                            {badge}
                          </span>
                        ) : null}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-2 space-y-1 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3 px-1 py-2">
            <span className="flex items-center gap-2 text-[0.8125rem] text-fg">
              {theme === 'dark' ? <Moon className="size-4 text-fg-subtle" /> : <Sun className="size-4 text-fg-subtle" />}
              Appearance
            </span>
            <IconButton label="Toggle theme" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </IconButton>
          </div>
          <Link
            to="/saved"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-fg-muted transition-colors hover:bg-surface/50 hover:text-fg"
          >
            <Bookmark className="size-[1.125rem] text-fg-subtle" aria-hidden="true" />
            <span className="text-[0.8125rem]">Saved items</span>
            {state.saved.length > 0 ? <span className="numeric ml-auto text-xs text-fg-subtle">{state.saved.length}</span> : null}
          </Link>
          <button
            type="button"
            onClick={() => {
              signOut();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-danger transition-colors hover:bg-danger-soft"
          >
            <LogOut className="size-[1.125rem]" aria-hidden="true" />
            <span className="text-[0.8125rem]">Sign out</span>
          </button>
          <p className="flex items-start gap-2 px-3 py-3 text-[0.6875rem] leading-relaxed text-fg-subtle">
            <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
            Demonstration environment — academic records, listings and availability are sample data.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
