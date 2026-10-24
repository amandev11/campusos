import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileTabBar, MobileNavDrawer } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { DEMO_DATA_NOTICE } from '@/lib/backend';
import { useHotkey, usePersistentState } from '@/hooks';
import { cn } from '@/lib/cn';

export function AppShell() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const [collapsed, setCollapsed] = usePersistentState<boolean>('sidebar.collapsed', false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [announced, setAnnounced] = useState(false);

  useHotkey({ key: 'k', mod: true }, (event) => {
    event.preventDefault();
    setPaletteOpen((current) => !current);
  });

  useHotkey({ key: '/' }, (event) => {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;
    event.preventDefault();
    setPaletteOpen(true);
  });

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(true), 900);
    const hide = window.setTimeout(() => setAnnounced(false), 9000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(hide);
    };
  }, []);

  return (
    <div className="min-h-dvh lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:border focus:border-line focus:bg-raised focus:px-4 focus:py-2 focus:text-sm focus:text-fg"
      >
        Skip to main content
      </a>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} onOpenMobileNav={() => setDrawerOpen(true)} />

        {announced ? (
          <div className="border-b border-line bg-accent-soft px-4 py-2 text-center text-xs text-accent">
            {DEMO_DATA_NOTICE}
          </div>
        ) : null}

        <main
          id="main-content"
          className={cn('mx-auto w-full max-w-[104rem] flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:pb-14', 'lg:px-8')}
        >
          <motion.div
            key={location.pathname}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>

        <footer className="hidden border-t border-line px-8 py-6 text-xs text-fg-subtle lg:block">
          <div className="mx-auto flex max-w-[104rem] flex-wrap items-center justify-between gap-3">
            <span>CampusOS · Your entire campus. One intelligent space.</span>
            <span>
              Demonstration build — academic records, listings, and parking availability are sample data unless an
              institutional source is connected.
            </span>
          </div>
        </footer>
      </div>

      <MobileTabBar onOpenMore={() => setDrawerOpen(true)} />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
