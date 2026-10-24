import { useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronsLeft, ChevronsRight, GraduationCap, PanelLeftClose } from 'lucide-react';
import { PRIMARY_NAV } from '@/config/navigation';
import { useApp } from '@/store/AppProvider';
import { cn } from '@/lib/cn';
import { Wordmark } from '@/components/brand/Logo';
import { IconButton, StatusDot } from '@/components/ui/primitives';
import { useMinuteClock } from '@/hooks';

function isActivePath(pathname: string, href: string, match?: string[]): boolean {
  if (href === '/') return pathname === '/';
  if (pathname === href) return true;
  const prefixes = match ?? [href];
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { pathname } = useLocation();
  const { state, unreadNotifications, unreadThreads, assignments } = useApp();
  const reduced = useReducedMotion();
  const now = useMinuteClock();

  /** Open assignments falling due inside a week — a useful, honest badge. */
  const dueSoon = useMemo(() => {
    const horizon = now.getTime() + 7 * 86400000;
    return assignments.filter(
      (assignment) =>
        assignment.state === 'open' &&
        new Date(assignment.dueAt).getTime() <= horizon &&
        new Date(assignment.dueAt).getTime() >= now.getTime() - 86400000 &&
        !state.submissions[assignment.id],
    ).length;
  }, [assignments, state.submissions, now]);

  const badgeFor = (key?: string): number => {
    if (key === 'notifications') return unreadNotifications;
    if (key === 'messages') return unreadThreads;
    if (key === 'saved') return state.saved.length;
    if (key === 'assignments') return dueSoon;
    return 0;
  };

  return (
    <aside
      className={cn(
        'glass-surface glass-nav group/sidebar sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line lg:flex',
        collapsed ? 'w-[4.75rem]' : 'w-[17.5rem]',
      )}
      style={{ transition: 'width 320ms var(--ease-out-quint)' }}
      aria-label="Primary navigation"
    >
      <div className={cn('flex h-16 items-center border-b border-line', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        <Link to="/" className="rounded-lg outline-offset-4" aria-label="CampusOS home">
          <Wordmark compact={collapsed} size={collapsed ? 'md' : 'md'} />
        </Link>
        {!collapsed ? (
          <IconButton label="Collapse navigation" size="sm" onClick={onToggle}>
            <PanelLeftClose className="size-4" aria-hidden="true" />
          </IconButton>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="mx-3 mt-4 rounded-xl border border-line bg-surface/45 px-3.5 py-3">
          <p className="caps">Institution</p>
          <p className="mt-1.5 truncate text-[0.8125rem] font-medium text-fg">
            {state.profile.university || 'Not set yet'}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-subtle">
            <StatusDot tone="teal" />
            {state.profile.semester > 0 ? `Semester ${state.profile.semester}` : state.profile.programme || 'Demonstration mode'}
          </p>
        </div>
      ) : null}

      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-4">
        {PRIMARY_NAV.map((section) => (
          <div key={section.id} className="mb-5 last:mb-0">
            {!collapsed ? (
              <p className="px-2.5 pb-2 text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">{section.label}</p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-line-strong" aria-hidden="true" />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActivePath(pathname, item.href, item.match);
                const badge = badgeFor(item.badgeKey);
                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.href}
                      end={item.href === '/'}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center rounded-xl text-[0.8125rem] transition-colors duration-200',
                        collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-2.5 py-2.5',
                        active ? 'text-fg' : 'text-fg-muted hover:text-fg',
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="sidebar-active"
                          transition={reduced ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute inset-0 rounded-xl border border-line bg-surface/70"
                          aria-hidden="true"
                        />
                      ) : null}
                      {active ? (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-accent"
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className={cn('relative z-10 shrink-0', active ? 'text-accent' : 'text-fg-subtle')}>
                        {item.icon}
                      </span>
                      {!collapsed ? (
                        <>
                          <span className="relative z-10 min-w-0 flex-1 truncate font-medium">{item.label}</span>
                          {badge > 0 ? (
                            <span
                              className={cn(
                                'numeric relative z-10 rounded-full border px-1.5 py-0.5 text-[0.625rem]',
                                item.badgeKey === 'assignments'
                                  ? 'border-warn/40 bg-warn-soft text-warn'
                                  : 'border-accent/40 bg-accent-soft text-accent',
                              )}
                            >
                              {badge}
                            </span>
                          ) : null}
                        </>
                      ) : badge > 0 ? (
                        <span
                          className="absolute right-2 top-1.5 size-1.5 rounded-full bg-accent"
                          aria-label={`${badge} unread`}
                        />
                      ) : null}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-2.5">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <IconButton label="Expand navigation" size="sm" onClick={onToggle}>
              <ChevronsRight className="size-4" aria-hidden="true" />
            </IconButton>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface/45 px-3 py-3">
            <p className="flex items-center gap-2 text-xs font-medium text-fg">
              <GraduationCap className="size-3.5 text-accent" aria-hidden="true" />
              Demonstration environment
            </p>
            <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-fg-subtle">
              Academic records, listings and availability are sample data. Connect an institutional source in Settings.
            </p>
            <button
              type="button"
              onClick={onToggle}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[0.6875rem] text-fg-subtle transition-colors hover:text-fg"
            >
              <ChevronsLeft className="size-3" aria-hidden="true" />
              Collapse rail
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
