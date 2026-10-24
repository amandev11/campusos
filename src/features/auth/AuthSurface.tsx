import type { ReactNode } from 'react';
import { BookOpen, CircleParking, Compass, GraduationCap, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/store/ThemeProvider';
import { BrandLockup } from '@/components/brand/Logo';
import { IconButton, Panel } from '@/components/ui/primitives';
import { PHOTO, photo } from '@/data/media';
import { SmartImage } from '@/components/ui/SmartImage';

const MODULE_SUMMARY = [
  {
    icon: GraduationCap,
    title: 'Academic hub',
    body: 'Timetable, attendance, assignments, notices and every course document in one place.',
  },
  {
    icon: BookOpen,
    title: 'Books & resources',
    body: 'Buy, sell, borrow and share textbooks and course material with your own campus.',
  },
  {
    icon: Compass,
    title: 'Travel & work',
    body: 'Internships, seasonal roles, teaching posts and travel programmes, with honest provenance.',
  },
  {
    icon: CircleParking,
    title: 'Campus parking',
    body: 'Find a space, check eligibility and reserve a bay without queueing at the barrier.',
  },
];

export function AuthSurface({
  children,
  aside,
  wide = false,
}: {
  children: ReactNode;
  aside?: ReactNode;
  wide?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <SmartImage
          src={photo(PHOTO.campusQuad, { w: 1400, h: 1600 })}
          alt="Campus quadrangle in the late afternoon"
          wrapperClassName="absolute inset-0 h-full"
          sizes="52vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-canvas/95 via-canvas/80 to-canvas/40" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <BrandLockup className="items-start text-left" />
          <div className="max-w-md">
            <p className="caps">One account</p>
            <h2 className="display mt-3 text-[2rem] leading-tight text-fg">
              Four services, one continuous experience.
            </h2>
            <ul className="mt-7 space-y-5">
              {MODULE_SUMMARY.map((entry) => (
                <li key={entry.title} className="flex gap-3.5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface/60 text-accent">
                    <entry.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[0.875rem] font-medium text-fg">{entry.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{entry.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="max-w-md text-[0.6875rem] leading-relaxed text-fg-subtle">
            Demonstration environment. Accounts, academic records, listings and parking availability are sample data
            held in your browser. No institutional system is connected.
          </p>
        </div>
      </div>

      <div className="relative flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <BrandLockup className="items-start text-left" />
          </div>
          <div className="ml-auto">
            <IconButton label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="size-[1.125rem]" /> : <Moon className="size-[1.125rem]" />}
            </IconButton>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className={wide ? 'w-full max-w-3xl' : 'w-full max-w-md'}>
            <Panel strength="float" className="p-6 sm:p-8">
              {children}
            </Panel>
            {aside ? <div className="mt-5">{aside}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
