import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CircleParking,
  ClipboardList,
  FileText,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  UserRound,
  Users,
} from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { useAuth } from '@/store/AuthProvider';
import { useTheme } from '@/store/ThemeProvider';
import { cn } from '@/lib/cn';
import { Avatar, Badge, IconButton, Kbd } from '@/components/ui/primitives';
import { Menu as MenuPrimitive, Popover, type MenuItem } from '@/components/ui/overlays';
import { NotificationList } from '@/features/notifications/NotificationList';
import { Breadcrumbs } from './Breadcrumbs';
import { ROUTE_TITLES } from '@/config/navigation';
import type { Role } from '@/lib/types';

export function Topbar({
  onOpenPalette,
  onOpenMobileNav,
}: {
  onOpenPalette: () => void;
  onOpenMobileNav: () => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { state, unreadNotifications } = useApp();
  const { profile, accounts, signInAs, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const quickActions = useMemo<MenuItem[]>(() => {
    const role = profile?.role ?? 'student';
    const items: MenuItem[] = [];

    if (role === 'student') {
      items.push(
        {
          id: 'list-book',
          label: 'List a book',
          hint: 'Sell, lend, exchange or give away',
          icon: <BookOpen className="size-4" />,
          onSelect: () => navigate('/books/new'),
        },
        {
          id: 'reserve',
          label: 'Reserve parking',
          hint: 'Check eligibility and book a bay',
          icon: <CircleParking className="size-4" />,
          onSelect: () => navigate('/parking'),
        },
        {
          id: 'tracker',
          label: 'Open application tracker',
          hint: 'Saved, preparing, applied, interviewing',
          icon: <ClipboardList className="size-4" />,
          onSelect: () => navigate('/opportunities/tracker'),
        },
      );
    }

    if (role === 'faculty') {
      items.push(
        {
          id: 'announce',
          label: 'Publish a course announcement',
          icon: <Megaphone className="size-4" />,
          onSelect: () => navigate('/academics/manage/notice'),
        },
        {
          id: 'assignment',
          label: 'Create an assignment',
          icon: <ClipboardList className="size-4" />,
          onSelect: () => navigate('/academics/manage/assignment'),
        },
        {
          id: 'document',
          label: 'Add course material',
          icon: <FileText className="size-4" />,
          onSelect: () => navigate('/academics/manage/document'),
        },
      );
    }

    if (role === 'admin') {
      items.push(
        {
          id: 'notice',
          label: 'Publish an institution notice',
          icon: <Megaphone className="size-4" />,
          onSelect: () => navigate('/academics/manage/notice'),
        },
        {
          id: 'document',
          label: 'Add an official document',
          icon: <FileText className="size-4" />,
          onSelect: () => navigate('/academics/manage/document'),
        },
        {
          id: 'parking',
          label: 'Review parking operations',
          icon: <CircleParking className="size-4" />,
          onSelect: () => navigate('/parking'),
        },
      );
    }

    items.push({
      id: 'message',
      label: 'Messages',
      icon: <Users className="size-4" />,
      onSelect: () => navigate('/messages'),
    });

    return items;
  }, [navigate, profile?.role]);

  const profileMenu = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        id: 'profile',
        label: 'Profile',
        icon: <UserRound className="size-4" />,
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: <Settings className="size-4" />,
        onSelect: () => navigate('/settings?tab=preferences'),
      },
      {
        id: 'appearance',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />,
        onSelect: toggleTheme,
      },
    ];

    const roles: Role[] = ['student', 'faculty', 'admin'];
    for (const role of roles) {
      const account = accounts.find((entry) => entry.role === role);
      if (!account) continue;
      items.push({
        id: `role-${role}`,
        label: `View as ${account.name}`,
        hint: `${role} demonstration account`,
        icon: <Users className="size-4" />,
        selected: profile?.id === account.id,
        onSelect: () => {
          const result = signInAs(role);
          if (result.ok) navigate('/');
        },
      });
    }

    items.push({
      id: 'signout',
      label: 'Sign out',
      icon: <LogOut className="size-4" />,
      destructive: true,
      onSelect: () => {
        signOut();
        navigate('/signin');
      },
    });

    return items;
  }, [accounts, navigate, profile?.id, signInAs, signOut, theme, toggleTheme]);

  const pageTitle = ROUTE_TITLES[pathname] ?? 'CampusOS';

  return (
    <header className="glass-surface glass-nav sticky top-0 z-30 border-b border-line">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <IconButton label="Open navigation" className="lg:hidden" onClick={onOpenMobileNav}>
          <Menu className="size-5" aria-hidden="true" />
        </IconButton>

        <div className="hidden min-w-0 lg:block">
          <Breadcrumbs />
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg lg:hidden">{pageTitle}</p>

        <button
          type="button"
          onClick={onOpenPalette}
          className={cn(
            'group ml-auto hidden h-10 items-center gap-3 rounded-xl border border-line bg-surface/50 px-3.5 text-left transition-all duration-200 hover:border-line-strong md:flex',
            'w-[15rem] lg:w-[19rem] xl:w-[23rem]',
          )}
        >
          <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-fg-subtle">
            Search books, jobs, notices, parking
          </span>
          <Kbd>⌘K</Kbd>
        </button>

        <IconButton label="Search" className="ml-auto md:hidden" onClick={onOpenPalette}>
          <Search className="size-5" aria-hidden="true" />
        </IconButton>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <MenuPrimitive
            align="end"
            label="Quick actions"
            items={quickActions}
            trigger={({ toggle, ref }) => (
              <button
                ref={ref}
                type="button"
                onClick={toggle}
                aria-haspopup="menu"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line bg-surface/50 px-2.5 text-[0.8125rem] text-fg transition-colors hover:border-line-strong"
              >
                <Plus className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Create</span>
              </button>
            )}
          />

          <IconButton label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="size-[1.125rem]" aria-hidden="true" /> : <Moon className="size-[1.125rem]" aria-hidden="true" />}
          </IconButton>

          <Popover
            label="Notifications"
            width="w-[24rem]"
            trigger={({ toggle, ref, open }) => (
              <button
                ref={ref}
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
                className="relative inline-flex size-10 items-center justify-center rounded-lg border border-transparent text-fg-muted transition-colors hover:border-line hover:bg-surface/70 hover:text-fg"
              >
                <Bell className="size-[1.125rem]" aria-hidden="true" />
                {unreadNotifications > 0 ? (
                  <span className="numeric absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-semibold text-accent-ink">
                    {unreadNotifications}
                  </span>
                ) : null}
              </button>
            )}
          >
            {({ close }) => <NotificationList onNavigate={close} />}
          </Popover>

          <MenuPrimitive
            align="end"
            label="Account menu"
            items={profileMenu}
            header={
              <div className="flex items-center gap-3">
                <Avatar name={state.profile.name} seed={state.profile.avatarSeed} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-[0.8125rem] font-medium text-fg">{state.profile.name}</p>
                  <p className="truncate text-xs text-fg-subtle">{state.profile.email}</p>
                  <Badge tone="accent" className="mt-1">
                    {state.profile.role}
                  </Badge>
                </div>
              </div>
            }
            trigger={({ toggle, ref }) => (
              <button ref={ref} type="button" onClick={toggle} aria-haspopup="menu" aria-label="Account menu" className="ml-0.5">
                <Avatar name={state.profile.name} seed={state.profile.avatarSeed} size="sm" />
              </button>
            )}
          />
        </div>
      </div>

    </header>
  );
}

