# CampusOS

**Your entire campus. One intelligent space.**

CampusOS is a single university super-app that unifies four services under one identity, one navigation system and one account:

| Module | What it covers |
| --- | --- |
| **Books & Resources** | Textbook discovery, used-book listings, buy / sell / borrow / exchange, free study material |
| **Travel & Work** | Internships, part-time and entry-level roles, teaching, seasonal and international work, application tracker |
| **Student ERP & Campus Hub** | Timetable, attendance, assignments, exams, notices, document library, faculty directory, role-gated authoring |
| **Campus Parking** | Area discovery, availability, eligibility, reservation, cancellation and booking history |

Shared across all four: overview dashboard, global search and Ctrl/⌘K command palette, saved items, notifications, messages, profile and preferences, and a light/dark theme.

---

## Live

| | |
| --- | --- |
| Production | <https://campusos-drab.vercel.app> |
| Repository | <https://github.com/amandev11/campusos> |

The Vercel project is connected to this repository, so every push to `main` builds and deploys. `vercel.json` sets the Vite preset plus a catch-all rewrite to `/index.html`, because the app uses client-side routing and a deep link such as `/opportunities/tracker` would otherwise 404. Rewrites run after the filesystem, so hashed assets still resolve as real files.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build:

```bash
npm run build        # typecheck, then vite build to dist/
npm run preview
```

Requires Node 20+ and the package manager that produced `package-lock.json`.

---

## Verification

`npm run verify` is the gate for this repository. It runs, in order:

| Command | What it proves |
| --- | --- |
| `npm run typecheck` | `tsc --noEmit` across the whole app |
| `npm run check:markup` | No `<a>` inside `<a>`, no `<button>` inside a link — React only warns about this at runtime, and only for routes a test happens to visit |
| `npm run check:contrast` | 39 token pairs × both themes meet WCAG 2.2 AA, with translucent glass and tinted badges composited against the surface they sit on |
| `npm run build` | Route-level code splitting and a clean production bundle |
| `npm run smoke` | Boots the real app in happy-dom, walks all 30 routes, then runs six workflows end to end |

`npm run smoke:reduced` repeats the smoke walk with `prefers-reduced-motion: reduce` emulated.

The smoke test covers real behaviour, not screenshots: Ctrl/⌘K palette open → cross-module search → Escape; save and un-save a book; switch theme; advance an application stage and find it on the tracker; reserve a bay, receive a reference, cancel it and keep it in history; then boot a **second session** with the same stored data and assert that the session, the theme and saved items all survive.

**What is not covered here:** visual layout, real focus behaviour and screen-reader output need a browser. Those checks have not been run by this repository's tooling, and nothing in this README should be read as claiming they were.

---

## Stack

- **React 19** + **TypeScript** (strict) + **Vite 8**
- **Tailwind CSS 4** with the token layer in `src/styles/index.css`
- **motion** (Framer Motion's successor) for transitions, layout animation and the theme cross-fade
- **lucide-react** for icons
- **happy-dom** powers the smoke test only

State lives in a single `useReducer` store (`src/store/state.ts`) exposed through `AppProvider`, with `AuthProvider` and `ThemeProvider` alongside it.

---

## Architecture

```
src/
  components/
    brand/      Wordmark and geometric symbol
    shell/      AppShell, Sidebar, Topbar, MobileNav, CommandPalette, Breadcrumbs
    ui/         Design system: primitives, fields, overlays, Toast, DataViz, SmartImage
  config/       Navigation definitions and route titles (single source of truth)
  data/         Demonstration content: books, opportunities, academics, parking, community, media
  features/     One folder per module — pages plus module-specific components
    academics/  books/  opportunities/  parking/  auth/  notifications/  shared/
  hooks/        useHotkey, useMediaQuery, useMinuteClock, usePersistentState
  lib/          types, format, storage, search index, ids, backend integration registry
  pages/        Cross-module routes: overview, search, saved, messages, notifications, settings
  store/        state (reducer + seeds), AppProvider, AuthProvider, ThemeProvider
  styles/       Design tokens and the glass material layer
tools/          check-markup.mjs, check-contrast.mjs, smoke.mjs
```

Conventions that keep the codebase navigable:

- **One source of truth for navigation.** `src/config/navigation.tsx` declares the sidebar, the mobile tab bar, module sub-navigation, route titles and breadcrumb labels. Adding a destination there is enough for it to appear everywhere.
- **Tokens, never raw colours.** Components use `text-fg-muted`, `bg-surface/40`, `border-line` and friends. Both themes are one variable swap.
- **Cards that are links do not wrap links.** Use `StretchedLink` from `@/features/shared` inside a `relative` container and give sibling controls `relative z-10`. `check:markup` fails the build if this regresses.
- **Lazy route elements.** Every page is `React.lazy`, so the build emits a chunk per route.

---

## Design system

**Glass.** Four material strengths are defined as tokens — navigation, panel, float, modal — plus a sheet and an input material. Blur radius and background opacity differ per strength, ambient gradients sit behind the layers, and mobile reduces blur sizes to keep modest GPUs comfortable. Anything carrying dense data sits on a solid or near-opaque surface instead.

**Colour.** Dark-first: midnight canvas `#0A0F17`, graphite surfaces, ivory text, champagne accent, restrained teal for secondary state. The light theme is a full re-tokenisation (warm ivory canvas, deeper bronze accent) rather than an inversion, and both pass the contrast audit in `tools/check-contrast.mjs`.

**Type.** Instrument Serif for editorial display headings, Inter for interface text, JetBrains Mono for numerals and metadata (classed `numeric`). Hierarchy comes from size, weight and letter-spacing steps defined once in the token layer.

**Motion.** Short, purposeful transitions: page transitions on route change, layout animation for the sidebar's active indicator, staggered entrances on first paint, modal and sheet transitions with depth separation. Every animation path checks `useReducedMotion()` and degrades to opacity or nothing at all.

---

## Data, persistence and honesty

There is no backend configured in this workspace, so CampusOS runs in **demonstration mode**:

- Persistence is `localStorage`, namespaced `campusos.*` and failure-tolerant (`src/lib/storage.ts`). It is **browser-local**, and the app says so — in the sidebar, in a dismissible banner, in Settings, and with per-record provenance tags (`demo`, `user`, `institution`, `partner`).
- Sample data is realistic but never presented as official. Attendance figures are marked as demonstration data; parking availability carries a "recorded N minutes ago, simulated" timestamp; opportunity listings are labelled demonstration and link to a source field rather than claiming verification; no payment is collected anywhere.
- Roles are real in the UI sense (student / faculty / admin gate authoring surfaces and see different seeds), but they are **not** an authorization boundary — there is no server to enforce one. The moment a real backend is attached, authorization belongs there, not in React.
- Nothing fabricates reviews, transactions, employers, visa promises or occupancy readings.

### Integrations

`src/lib/backend.ts` declares the integrations this build is prepared for, each with the exact variables it needs and what CampusOS does in the meantime. Settings → Integrations renders this same table live.

| Integration | Variables | Unconfigured behaviour |
| --- | --- | --- |
| Postgres backend & authentication | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Browser-local storage, labelled demonstration data |
| Payments provider | `VITE_PAYMENTS_PUBLISHER_KEY` | No payment is collected; listings settle in person |
| Institutional ERP / SIS | `VITE_ERP_API_URL` | Academic records shown as sample content |
| Parking occupancy & barrier system | `VITE_PARKING_FEED_URL` | Availability is simulated and timestamped as such |
| Verified opportunity feed | `VITE_OPPORTUNITIES_FEED_URL` | Listings labelled demonstration, source field shown |

Setting any of these flips the relevant feature on and drops its warning copy; the rest of the app is unaffected. Secrets belong in the platform's environment or secret store — never in the bundle.

---

## Accessibility and performance

- Semantic landmarks, a skip link, labelled dialogs and menus, `aria-current` on the active nav item, live regions for toasts, visible focus rings on every interactive element.
- Contrast is enforced by a tool rather than by eye; both themes pass AA on text, on tinted badges and on focus indicators.
- Reduced motion is honoured in CSS and in every motion component.
- Route-level code splitting, lazy imagery with intrinsic sizing to avoid layout shift, and blur budget reductions below 640px.

Keyboard shortcuts: `Ctrl/⌘K` and `/` open the command palette; `Escape` closes overlays.

---

## Extending CampusOS

1. Add or extend data in `src/data/*`, keeping provenance in the type (`origin`).
2. Add the route in `src/App.tsx` (lazy) and its title in `src/config/navigation.tsx`.
3. Build the page under `src/features/<module>/`, composing primitives from `src/components/ui`.
4. Wire mutations through the reducer in `src/store/state.ts` so they persist and feed notifications, saved items and the overview.
5. Run `npm run verify`.

No feature should render a control that does nothing: disable it with a stated reason (`BlockedAction`, or a `disabled` button with a title) until its integration exists.
