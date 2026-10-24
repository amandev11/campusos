/**
 * CampusOS runtime smoke test.
 *
 * Boots the real application source through Vite's SSR module loader inside a
 * happy-dom window, signs in, then walks every route checking that the expected
 * copy renders in the page region, that no invalid interactive nesting appears,
 * and that nothing throws or logs an error.
 *
 * It then exercises real workflows end to end:
 *   · Ctrl+K opens the command palette, searches every module, Escape closes it
 *   · saving and un-saving a book round-trips through Saved items
 *   · the theme toggle persists and applies to <html>
 *   · an application advances a stage and shows up on the tracker
 *   · a bay is reserved, confirmed with a reference, then cancelled
 *   · a second session boots and restores session, theme and saved items
 *
 *   npm run smoke                  # full walk
 *   SMOKE_REDUCED=1 npm run smoke   # same walk with prefers-reduced-motion
 *
 * This is deliberately not a visual test — it proves the pages render, the store
 * wires up, routing and deep links work, and mutations reach persisted state.
 * Colour contrast is checked separately by `npm run check:contrast`; real visual,
 * layout and assistive-technology checks still need a browser.
 */
import { createServer } from 'vite';
import { Window } from 'happy-dom';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REDUCED_MOTION = process.env.SMOKE_REDUCED === '1';

const PROBLEMS = [];
const CONSOLE_ERRORS = [];

function setupDom(url) {
  const window = new Window({ url, width: 1440, height: 900 });

  // happy-dom's Web Animations implementation throws AbortError when motion
  // stops a WAAPI animation on mount. Removing `Element.prototype.animate`
  // makes motion fall back to its main-thread rAF driver, which the harness
  // already shims. The application code itself is unaffected.
  delete window.Element.prototype.animate;
  delete window.document.timeline;

  window.matchMedia = (query) => ({
    matches: REDUCED_MOTION && String(query).includes('prefers-reduced-motion'),
    media: String(query),
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  });

  const g = globalThis;
  const exposed = [
    'document',
    'navigator',
    'location',
    'history',
    'localStorage',
    'sessionStorage',
    'HTMLElement',
    'HTMLInputElement',
    'HTMLTextAreaElement',
    'HTMLSelectElement',
    'HTMLImageElement',
    'Element',
    'Node',
    'Event',
    'CustomEvent',
    'PopStateEvent',
    'MouseEvent',
    'KeyboardEvent',
    'Blob',
    'File',
    'FileReader',
    'Image',
    'AbortController',
    'ResizeObserver',
    'IntersectionObserver',
  ];

  // Node 24 exposes some of these as getter-only globals (navigator), so define
  // them instead of assigning.
  const define = (key, value) => {
    Object.defineProperty(g, key, { value, writable: true, enumerable: true, configurable: true });
  };

  for (const key of exposed) {
    if (window[key] !== undefined) define(key, window[key]);
  }
  define('window', window);
  define('URL', window.URL);
  define('getComputedStyle', window.getComputedStyle.bind(window));
  define('requestAnimationFrame', (callback) => setTimeout(() => callback(Date.now()), 0));
  define('cancelAnimationFrame', (id) => clearTimeout(id));
  define('matchMedia', window.matchMedia.bind(window));
  define('IS_REACT_ACT_ENVIRONMENT', false);

  document.body.innerHTML = '<div id="root"></div>';
  return window;
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const textOf = (node) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

function findByText(root, text, tag = 'button') {
  return [...root.querySelectorAll(tag)].find((node) =>
    textOf(node).toLowerCase().includes(text.toLowerCase()),
  );
}

/** Poll until `predicate` is true, so first-time Vite transforms don't flake. */
async function waitFor(predicate, { timeout = 8000, interval = 120, label = 'condition' } = {}) {
  const started = Date.now();
  for (;;) {
    let result = false;
    try {
      result = predicate();
    } catch {
      result = false;
    }
    if (result) return true;
    if (Date.now() - started > timeout) {
      throw new Error(`timed out waiting for ${label}`);
    }
    await sleep(interval);
  }
}

async function main() {
  let window = setupDom('http://localhost/signin');

  /**
   * Logs the harness itself provokes, which say nothing about the application:
   *   · React's `act` notice, because this runner drives renders outside `act`.
   *   · motion's reduced-motion advisory, printed because SMOKE_REDUCED forces
   *     `prefers-reduced-motion: reduce` — without that run it never appears.
   */
  const HARNESS_NOISE = ['not wrapped in act', 'Reduced Motion enabled on your device'];
  const isHarnessNoise = (message) => HARNESS_NOISE.some((fragment) => message.includes(fragment));

  const originalError = console.error;
  console.error = (...args) => {
    const message = args
      .map((arg) => (arg instanceof Error ? `${arg.name}: ${arg.message}` : String(arg)))
      .join(' ');
    if (!isHarnessNoise(message)) CONSOLE_ERRORS.push(message);
    originalError(...args);
  };
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.map(String).join(' ');
    if (!isHarnessNoise(message)) CONSOLE_ERRORS.push(`warn: ${message}`);
    originalWarn(...args);
  };

  const watchWindow = (target) => {
    target.addEventListener('error', (event) => PROBLEMS.push(`window error: ${event.message}`));
    target.addEventListener('unhandledrejection', (event) =>
      PROBLEMS.push(`unhandled rejection: ${event.reason}`),
    );
  };
  watchWindow(window);

  const vite = await createServer({
    root: ROOT,
    configFile: resolve(ROOT, 'vite.config.ts'),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'warn',
  });

  await vite.ssrLoadModule('/src/main.tsx');

  const root = () => document.getElementById('root');
  /** Page copy only — the persistent sidebar/topbar must not satisfy a route check. */
  const page = () => document.querySelector('main') ?? document.getElementById('root');
  const pageText = () => textOf(page());
  /** Exact-label button lookup scoped to the current page. */
  const findButton = (label) =>
    [...page().querySelectorAll('button')].find(
      (button) => textOf(button).toLowerCase() === label.toLowerCase(),
    );
  let text = '';

  await waitFor(() => textOf(root()).includes('Sign in to CampusOS'), {
    label: 'the sign-in page to render',
  });
  text = textOf(root());
  assert.ok(text.includes('Your entire campus'), 'brand tagline missing from the auth surface');
  console.log(`✓ sign-in page rendered${REDUCED_MOTION ? ' (reduced motion)' : ''}`);

  const studentButton = findByText(page(), 'student');
  assert.ok(studentButton, 'student quick-sign-in button missing');
  studentButton.click();

  await waitFor(() => textOf(root()).includes('Academic Hub'), {
    label: 'the signed-in shell to render',
  });
  text = textOf(root());
  for (const label of ['Travel & Work', 'Campus Parking', 'Saved', 'Notifications']) {
    assert.ok(text.includes(label), `sidebar navigation missing "${label}"`);
  }
  console.log('✓ signed in as the student account and rendered the overview');

  const goto = async (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new window.PopStateEvent('popstate'));
    // Let the lazy route chunk resolve; copy checks below poll properly.
    await sleep(60);
  };

  /**
   * Copy that must be on screen for each route.
   *
   * Every phrase is unique to its own page: a generic phrase ("Attendance",
   * "Sample data") is already on the route we arrive from, so waiting for it
   * would assert against the page we just left. The loop below enforces that
   * uniqueness, so keep new phrases specific to the page they describe.
   */
  const routes = [
    ['/', ['Everything below comes from your own account activity', 'Featured this week']],
    ['/search?q=algorithms', ['Unified search', 'items indexed']],
    ['/academics', ['instead of five disconnected portals', 'In your library']],
    ['/academics/timetable', ['Sessions, rooms and attendance standing in one grid', 'Busiest day']],
    ['/academics/attendance', ['institutional requirement', 'Sample records, not official ones']],
    ['/academics/assignments', ['Every piece of work across your courses', 'submissions, marks and feedback in the same place']],
    ['/academics/assignments/as-dbms-normalisation', ['Hand this in', 'This is my own work']],
    ['/academics/exams', ['Examination schedule', 'Open the datesheet']],
    ['/academics/notices', ['instead of a forwarded screenshot', 'Not yet opened']],
    ['/academics/notices/nt-exam-datesheet', ['Document referenced by this notice', 'Where this notice came from']],
    ['/academics/library', ['Study notes, question papers, slides, course packs and official circulars', 'How documents are handled']],
    ['/academics/library/doc-dsa-notes', ['Page 1 of', 'Generated preview']],
    ['/academics/directory', ['Faculty & department directory', 'Contact expectations']],
    ['/academics/courses/CS301', ['4 credits this semester', 'with 4 scheduled sessions each week']],
    ['/academics/manage/notice', ['Your role cannot publish this', 'requires a faculty or administrator account']],
    ['/books', ['without the group-chat chaos', 'Cheapest used copies']],
    ['/books/bk-intro-algorithms', ['Message the seller', 'Deals completed']],
    ['/books/new', ['Describe the copy honestly', 'Publish listing']],
    ['/books/my-listings', ['Everything you have put on the shelf', 'Awaiting moderation']],
    ['/opportunities', ['paperwork stated plainly', 'with housing']],
    ['/opportunities/op-nimbus-intern', ['runs internal developer tooling', 'Paid on the 1st']],
    ['/opportunities/tracker', ['Your application tracker', 'Nothing is inferred from email']],
    ['/parking', ['before you leave the hostel', 'report a feed']],
    ['/parking/lot-north-deck', ['What the feed reports', 'valid in this area']],
    ['/parking/bookings', ['Every booking with its reference', 'Hours booked']],
    ['/messages', ['Conversations in one place', 'threads']],
    ['/saved', ['One shortlist spanning every module', 'modules represented']],
    ['/notifications', ['Everything that needs your attention', 'into one feed']],
    ['/settings', ['how CampusOS behaves', 'what is stored on this device']],
    ['/this-route-does-not-exist', ['Error 404', 'That corner of campus does not exist']],
  ];

  /** Page copy of the route visited just before this one, to spot a stuck transition. */
  let previousText = '';

  for (const [path, needles] of routes) {
    const before = CONSOLE_ERRORS.length + PROBLEMS.length;

    // Guard the table itself: a needle already on screen before we navigate
    // cannot prove the next route rendered, because the assertion would run
    // against the page we are coming from. This is deterministic, not timing
    // dependent, so needle drift fails loudly instead of going flaky.
    const alreadyOnScreen = previousText
      ? needles.filter((needle) => previousText.toLowerCase().includes(needle.toLowerCase()))
      : [];
    if (alreadyOnScreen.length > 0) {
      PROBLEMS.push(
        `route ${path} needles are not unique to its page, they are already on the previous route: ${alreadyOnScreen.join(' | ')}`,
      );
      console.log(`✗ ${path} — needles not unique to this route: ${alreadyOnScreen.join(', ')}`);
      continue;
    }

    await goto(path);

    // Wait until *every* expected phrase is on screen at once, not merely the
    // last one: a phrase can also exist on the route we are coming from (the
    // opportunities list has a "Tracked" tile), and settling on that would
    // assert against the old page while the transition is still in flight.
    const satisfied = () => {
      const current = pageText().toLowerCase();
      return needles.every((needle) => current.includes(needle.toLowerCase()));
    };
    let settled = true;
    try {
      await waitFor(satisfied, {
        timeout: 12000,
        label: `route ${path} to render ${needles.map((needle) => `"${needle}"`).join(' and ')}`,
      });
    } catch {
      settled = false;
    }

    const rendered = pageText();
    const missing = needles.filter((needle) => !rendered.toLowerCase().includes(needle.toLowerCase()));
    const fresh = [...CONSOLE_ERRORS.slice(before), ...PROBLEMS.slice(before)];
    // Every route renders its own page region, so unchanged copy means the
    // transition never committed and the needles matched the previous route.
    const stuck = rendered === previousText && rendered.length > 0;
    previousText = rendered;

    // Invalid HTML: an anchor nested inside another anchor breaks keyboard and
    // screen-reader navigation, so treat it as a real defect.
    const nested = [...document.querySelectorAll('a a')];

    if (missing.length > 0) {
      PROBLEMS.push(
        `route ${path} missing copy: ${missing.join(' | ')}${settled ? '' : ' (never settled)'} :: rendered "${rendered.slice(0, 220)}"`,
      );
      console.log(`✗ ${path} — missing ${missing.join(', ')}`);
    } else if (stuck) {
      PROBLEMS.push(
        `route ${path} never replaced the previous route's page: still rendering "${rendered.slice(0, 220)}"`,
      );
      console.log(`✗ ${path} — page did not change`);
    } else if (nested.length > 0) {
      PROBLEMS.push(
        `route ${path} nests <a> inside <a>: ${nested[0].outerHTML.slice(0, 160)}`,
      );
      console.log(`✗ ${path} — nested anchor`);
    } else if (fresh.length > 0) {
      console.log(`! ${path} — rendered but logged: ${fresh[0].slice(0, 150)}`);
    } else {
      console.log(`✓ ${path}`);
    }
  }

  /* Interaction: Ctrl+K opens the command palette, searches, and Escape closes it. */
  await goto('/');
  await waitFor(() => document.querySelector('main') !== null, {
    label: 'the overview to render before the palette test',
  });
  window.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }),
  );
  const palette = () => document.querySelector('[role="dialog"][aria-label="Search CampusOS"]');
  try {
    await waitFor(() => palette() !== null, { label: 'the command palette to open on Ctrl+K' });
    const input = palette().querySelector('input');
    const setNative = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setNative?.call(input, 'North Deck');
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    await waitFor(
      () => textOf(document.querySelector('[role="listbox"]')).toLowerCase().includes('north deck'),
      { label: 'cross-module palette results for "North Deck"' },
    );
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await waitFor(() => palette() === null, { label: 'the command palette to close on Escape' });
    console.log('✓ Ctrl+K opened the palette, it searched every module, Escape closed it');
  } catch (error) {
    PROBLEMS.push(`command palette interaction failed: ${error.message}`);
    console.log(`✗ command palette — ${error.message}`);
    if (palette()) palette().querySelector('button')?.click();
  }

  /* Interaction: saving and un-saving a book must round-trip through Saved items. */
  const SAVED_BOOK = { id: 'bk-linear-algebra', title: 'Linear Algebra and Its Applications' };
  const isSaveControl = (button) => /^(save|saved)$/i.test(textOf(button));

  await goto(`/books/${SAVED_BOOK.id}`);
  await waitFor(() => [...page().querySelectorAll('button[aria-pressed]')].some(isSaveControl), {
    label: 'the save control on a book detail page',
  });

  const saveButton = () => [...page().querySelectorAll('button[aria-pressed]')].find(isSaveControl);
  // Seeded accounts start with a saved book, so normalise to the un-saved state first.
  if (saveButton().getAttribute('aria-pressed') === 'true') {
    saveButton().click();
    await waitFor(() => saveButton().getAttribute('aria-pressed') === 'false', {
      label: 'the save control to reset',
    });
  }

  saveButton().click();
  await waitFor(() => saveButton().getAttribute('aria-pressed') === 'true', {
    label: 'the book to be saved',
  });

  await goto('/saved');
  let savedOk = true;
  try {
    await waitFor(() => pageText().toLowerCase().includes(SAVED_BOOK.title.toLowerCase()), {
      label: 'the saved book to appear in Saved items',
    });
  } catch {
    savedOk = false;
  }

  if (!savedOk) {
    PROBLEMS.push('a saved book did not appear on /saved');
    console.log('✗ saving a book did not appear on /saved');
  } else {
    // …and removing it must clear it from the list again.
    await goto(`/books/${SAVED_BOOK.id}`);
    await waitFor(() => saveButton()?.getAttribute('aria-pressed') === 'true', {
      label: 'the persisted saved state on the book page',
    });
    saveButton().click();
    await waitFor(() => saveButton().getAttribute('aria-pressed') === 'false', {
      label: 'the book to be un-saved',
    });
    await goto('/saved');
    await sleep(400);
    if (pageText().toLowerCase().includes(SAVED_BOOK.title.toLowerCase())) {
      PROBLEMS.push('removing a saved book left it on /saved');
      console.log('✗ removing a saved book left it on /saved');
    } else {
      console.log('✓ saving a book added it to Saved items, and removing it cleared it');
    }
  }

  /* Interaction: theme toggle should persist and apply to <html>. */
  await goto('/settings?tab=preferences');
  await waitFor(() => findByText(page(), 'light') !== undefined, {
    label: 'the theme options on the preferences tab',
  });
  const lightOption = findByText(page(), 'light');
  lightOption.click();
  await waitFor(() => document.documentElement.getAttribute('data-theme') === 'light', {
    label: 'the light theme to apply',
  });
  const stored = JSON.parse(window.localStorage.getItem('campusos.theme') ?? 'null');
  const applied = document.documentElement.getAttribute('data-theme');
  if (stored === 'light' && applied === 'light') {
    console.log('✓ theme toggle switched to light, persisted and applied to <html>');
  } else {
    PROBLEMS.push(`theme toggle did not persist (stored=${JSON.stringify(stored)}, attr=${applied})`);
    console.log(`✗ theme toggle did not persist (stored=${JSON.stringify(stored)}, attr=${applied})`);
  }

  /* Interaction: advancing an application must persist to the tracker page. */
  await goto('/opportunities/op-nimbus-intern');
  await waitFor(() => findByText(page(), 'Move to') !== undefined, {
    label: 'the application tracking control',
  });
  const moveButton = findByText(page(), 'Move to');
  const targetStage = textOf(moveButton).replace(/^Move to\s+/i, '').trim();
  moveButton.click();
  await waitFor(() => textOf(document.body).includes('Updated in your tracker'), {
    label: 'the confirmation toast for the stage change',
  });
  await waitFor(() => pageText().includes(targetStage), {
    label: `the stage badge to read "${targetStage}"`,
  });
  await goto('/opportunities/tracker');
  try {
    await waitFor(() => [...page().querySelectorAll('button')].some((b) => textOf(b).startsWith('Closed')), {
      label: 'the tracker status tabs',
    });
    // The advanced application is completed, so it lives under the Closed tab.
    [...page().querySelectorAll('button')]
      .find((b) => textOf(b).startsWith('Closed'))
      .click();
    await waitFor(() => pageText().includes('Nimbus'), {
      label: 'the advanced application on the tracker page',
    });
    console.log(`✓ advancing an application moved it to ${targetStage} and the tracker shows it under Closed`);
  } catch {
    PROBLEMS.push('an application advanced on its detail page did not appear on the tracker');
    console.log('✗ the advanced application did not appear on the tracker');
  }

  /* Interaction: reserve a bay end-to-end, then cancel it under the policy. */
  const inDays = (days) => {
    const value = new Date();
    value.setDate(value.getDate() + days);
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-');
  };
  const bookingDate = inDays(3);
  const setNativeValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  const clickStep = async (label) => {
    await waitFor(() => findButton(label) && !findButton(label).disabled, {
      label: `the "${label}" step to appear enabled`,
    });
    findButton(label).click();
  };

  await goto('/parking/lot-north-deck');
  await waitFor(() => pageText().includes('Reserve a bay'), { label: 'the parking booking flow' });

  // Book three days out: clear of the seeded slots and far enough ahead that the
  // one-hour cancellation window always still applies when this test runs.
  const dateInput = page().querySelector('input[type="date"]');
  setNativeValue?.call(dateInput, bookingDate);
  dateInput.dispatchEvent(new window.Event('input', { bubbles: true }));
  dateInput.dispatchEvent(new window.Event('change', { bubbles: true }));

  try {
    await clickStep('Choose a bay type');
    await clickStep('Review');
    await clickStep('Confirm reservation');
    await waitFor(() => textOf(document.body).includes('Reservation confirmed'), {
      label: 'the booking confirmation',
    });
    // Read the reference from the toast itself, not the whole page: the lot page
    // also lists other reservations' references.
    const toastText = [...document.querySelectorAll('[aria-live="polite"]')]
      .map(textOf)
      .join(' ');
    const reference = (toastText.match(/CAMP-[A-Z0-9]+-[A-Z0-9]+/) ?? [])[0];
    if (!reference) throw new Error(`no booking reference was issued (toast read: "${toastText}")`);

    await goto('/parking/bookings');
    try {
      await waitFor(() => pageText().includes(reference), {
        label: 'the new reservation on the bookings page',
      });
    } catch {
      throw new Error(
        `reference ${reference} missing from /parking/bookings — page read: "${pageText().slice(0, 400)}"`,
      );
    }

    await clickStep('Cancel reservation');
    const dialog = () => document.querySelector('[role="dialog"][aria-modal="true"]');
    await waitFor(() => dialog() !== null, { label: 'the cancellation confirmation dialog' });
    const confirmCancel = [...dialog().querySelectorAll('button')].find(
      (button) => textOf(button).toLowerCase() === 'cancel reservation',
    );
    confirmCancel.click();
    await waitFor(() => textOf(document.body).includes('Reservation cancelled'), {
      label: 'the cancellation confirmation',
    });

    const cancelledTab = [...page().querySelectorAll('[role="tab"]')].find((tab) =>
      textOf(tab).startsWith('Cancelled'),
    );
    cancelledTab.click();
    await waitFor(() => pageText().includes(reference), {
      label: 'the released reservation to stay in the history as cancelled',
    });
    console.log(`✓ reserved ${reference} at North Deck, then cancelled it and kept it in history`);
  } catch (error) {
    PROBLEMS.push(`parking booking flow failed: ${error.message}`);
    console.log(`✗ parking booking flow — ${error.message}`);
  }

  /* Cross-boot: a second session with the same stored data must restore it. */
  try {
    const snapshot = {};
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key) snapshot[key] = window.localStorage.getItem(key);
    }

    await vite.moduleGraph.invalidateAll();
    window = setupDom('http://localhost/');
    watchWindow(window);
    for (const [key, value] of Object.entries(snapshot)) window.localStorage.setItem(key, value);
    await vite.ssrLoadModule('/src/main.tsx');

    await waitFor(
      () => textOf(root()).includes('Academic Hub') || textOf(root()).includes('Sign in to CampusOS'),
      { label: 'the second session to boot' },
    );

    const sessionRestored = textOf(root()).includes('Academic Hub');
    if (!sessionRestored) {
      PROBLEMS.push('the signed-in session did not survive a fresh boot');
      console.log('✗ the session did not survive a fresh boot');
    }

    const restoredTheme = document.documentElement.getAttribute('data-theme');
    if (restoredTheme !== 'light') {
      PROBLEMS.push(`the theme preference did not survive a fresh boot (got "${restoredTheme}")`);
      console.log(`✗ theme not restored on a fresh boot (got "${restoredTheme}")`);
    }

    if (sessionRestored) {
      await goto('/saved');
      await waitFor(() => pageText().includes('Clean Code'), {
        label: 'Saved items restored from storage on the second session',
      });
      console.log('✓ a second session restored the theme, the session and Saved items from storage');
    }
  } catch (error) {
    PROBLEMS.push(`cross-boot persistence failed: ${error.message}`);
    console.log(`✗ cross-boot persistence — ${error.message}`);
  }

  /* The pre-paint theme script in index.html must understand what the store writes. */
  try {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    const prePaint = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    if (!prePaint) throw new Error('no inline pre-paint script found in index.html');
    window.localStorage.setItem('campusos.theme', JSON.stringify('light'));
    document.documentElement.setAttribute('data-theme', 'dark');
    new Function(prePaint)();
    const applied = document.documentElement.getAttribute('data-theme');
    if (applied !== 'light') {
      throw new Error(`stored theme was not applied before paint (got "${applied}")`);
    }
    console.log('✓ index.html applies the stored theme before first paint');
  } catch (error) {
    PROBLEMS.push(`pre-paint theme script failed: ${error.message}`);
    console.log(`✗ pre-paint theme script — ${error.message}`);
  }

  await vite.close();

  console.log('\n================ summary ================');
  console.log(`console errors/warnings: ${CONSOLE_ERRORS.length}`);
  for (const entry of CONSOLE_ERRORS.slice(0, 10)) console.log(`  - ${entry.slice(0, 220)}`);
  console.log(`    problems: ${PROBLEMS.length}`);
  for (const entry of PROBLEMS.slice(0, 30)) console.log(`  - ${entry.slice(0, 300)}`);
  // Logged errors fail the run too: the summary is only worth reading if the
  // exit status reflects it.
  if (PROBLEMS.length > 0 || CONSOLE_ERRORS.length > 0) process.exitCode = 1;

  // happy-dom and Vite keep handles open after the run; exit explicitly so the
  // smoke test never hangs past its own summary.
  await new Promise((done) => process.stdout.write('', done));
  process.exit(process.exitCode ?? 0);
}

// A hard ceiling: if anything stalls, fail loudly instead of hanging.
setTimeout(() => {
  console.error('SMOKE WATCHDOG: the run exceeded 240s');
  console.log(`problems so far: ${PROBLEMS.length}`);
  process.exit(1);
}, 240_000).unref();

process.on('unhandledRejection', (reason) => {
  PROBLEMS.push(`unhandled rejection (top level): ${reason}`);
});

main().catch((error) => {
  console.error('SMOKE RUN FAILED:', error);
  process.exitCode = 1;
});

export {};
