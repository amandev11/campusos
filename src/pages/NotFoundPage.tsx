import { Link } from 'react-router-dom';
import { Compass, MapPin } from 'lucide-react';
import { ALL_NAV_ITEMS } from '@/config/navigation';
import { Button, Panel, SectionHeader } from '@/components/ui/primitives';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div>
        <p className="caps">Error 404</p>
        <h1 className="display mt-3 text-[2.25rem] leading-tight text-fg sm:text-[3rem]">
          That corner of campus does not exist
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-fg-muted">
          The page you asked for is not here. It may have been moved, renamed, or it may never have existed. Nothing
          has been lost — your saved items, listings and reservations are unaffected.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
          >
            Back to the overview
          </Link>
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>

      <Panel strength="float">
        <SectionHeader
          eyebrow="Everywhere you can go"
          title="Destinations in CampusOS"
          description="Four modules plus your personal workspace."
        />
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {ALL_NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className="flex items-start gap-3 rounded-xl border border-line bg-surface/45 p-3.5 transition-colors hover:border-line-strong hover:bg-surface/70"
              >
                <span className="mt-0.5 text-accent">{item.icon}</span>
                <span className="min-w-0">
                  <span className="block text-[0.8125rem] font-medium text-fg">{item.label}</span>
                  <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-fg-subtle">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <p className="flex items-center gap-2 text-xs text-fg-subtle">
        <Compass className="size-3.5" aria-hidden="true" />
        If you followed a link from inside CampusOS, that is a bug worth reporting.
      </p>

      <div className="flex items-center gap-2 text-[0.6875rem] text-fg-subtle">
        <MapPin className="size-3" aria-hidden="true" />
        CampusOS · Your entire campus. One intelligent space.
      </div>
    </div>
  );
}
